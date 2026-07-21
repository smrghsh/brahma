import * as THREE from "three";
import Experience from "../Experience.js";
import Interlocutors from "../avatars/Interlocutors.js";

/**
 * WebSocket client for a brahma-xr-server room. Shares your embodiment
 * (HMD + controller matrices) and renders everyone else's through
 * Interlocutors. No connection is opened until connect() is called.
 *
 * Identity (name, color) is assigned by the server's welcome message.
 *
 * @param {object} [options]
 * @param {string} [options.url] - server url, e.g. "ws://localhost:8080" —
 *   falls back to the Experience networking config
 * @param {string} [options.room] - room to join (default "default")
 */
export default class Networking {
  constructor(options = {}) {
    this.experience = new Experience();
    this.user = this.experience.user;

    const config = this.experience.config?.networking ?? {};
    this.url = options.url ?? config.url;
    this.room = options.room ?? config.room ?? "default";
    if (!this.url) {
      throw new Error(
        'brahma-xr: no server url. Pass networking: { url: "ws://localhost:8080" } to Experience ' +
          "(or { url } to Networking). Run a server locally with: npx brahma-xr-server",
      );
    }

    this.interlocutors = new Interlocutors();
    this.connected = false; // true once the server has welcomed us
    this.canSendEmbodiment = false; // gated on the welcome message
    this.shouldReconnect = false;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 15000;
    this.lastCalloutSend = 0;
    this.calloutThrottle = 100; // 10Hz max
  }

  /** Open the connection (idempotent). Reconnects automatically until disconnect(). */
  connect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }
    this.shouldReconnect = true;
    this.open();
  }

  open() {
    const url = new URL(this.url);
    url.searchParams.set("room", this.room);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(`brahma: connected to ${this.url} (room "${this.room}")`);
      this.reconnectDelay = 1000;
    };

    this.socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      this.handleServerMessage(data);
    };

    this.socket.onerror = (error) => {
      console.error("brahma: WebSocket error:", error);
    };

    this.socket.onclose = () => {
      this.connected = false;
      this.canSendEmbodiment = false;
      if (this.shouldReconnect) {
        console.log(
          `brahma: connection lost, reconnecting in ${this.reconnectDelay}ms`,
        );
        this.reconnectTimeout = setTimeout(
          () => this.open(),
          this.reconnectDelay,
        );
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2,
          this.maxReconnectDelay,
        );
      }
    };
  }

  /** Close the connection and stop reconnecting. */
  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimeout);
    this.socket?.close();
    this.connected = false;
    this.canSendEmbodiment = false;
  }

  handleServerMessage(data) {
    if (data.type === "welcome") {
      this.user.parameters.userName = data.name;
      this.user.parameters.color = data.color;
      this.connected = true;
      this.canSendEmbodiment = true;
      console.log(`brahma: welcome — you are ${data.name}`);
    } else if (data.type === "roster") {
      this.receiveEmbodiments(data.interlocutors);
    } else if (data.type === "callout") {
      this.receiveCalloutUpdate(data);
    }
    // Unknown message types are ignored so newer servers stay compatible
  }

  sendEmbodiment(HMD, LController, RController) {
    if (!this.canSendEmbodiment) return;
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const data = {
      v: 1,
      type: "pose",
      name: this.user.parameters.userName,
      color: this.user.parameters.color,
      HMDPosition: HMD.toArray(),
      LController: LController.toArray(),
      RController: RController.toArray(),
    };
    this.socket.send(JSON.stringify(data));
  }

  receiveEmbodiments(interlocutorsData) {
    try {
      // Get list of active interlocutor names from server
      const activeNames = new Set(interlocutorsData.map((i) => i.name));

      // Remove embodiments that are no longer in the server's list
      Object.keys(this.interlocutors.bodies).forEach((name) => {
        if (!activeNames.has(name)) {
          console.log(`🗑️ Removing disconnected embodiment: ${name}`);
          this.interlocutors.purgeEmbodiment(name);
        }
      });

      interlocutorsData.forEach((interlocutor) => {
        try {
          if (interlocutor.name === this.user.parameters.userName) {
            return;
          }

          if (!this.interlocutors.containsEmbodiment(interlocutor.name)) {
            console.log(
              `Instantiating new embodiment for ${interlocutor.name}`,
            );
            this.interlocutors.instantiateEmbodiment(
              interlocutor.name,
              new THREE.Color(parseInt(interlocutor?.color, 16)),
            );
          }

          if (
            interlocutor.HMDPosition &&
            interlocutor.LController &&
            interlocutor.RController
          ) {
            this.interlocutors.updateEmbodiment(
              interlocutor.name,
              new THREE.Matrix4().fromArray(interlocutor.HMDPosition),
              new THREE.Matrix4().fromArray(interlocutor.LController),
              new THREE.Matrix4().fromArray(interlocutor.RController),
            );
          }
        } catch (error) {
          console.error(
            `Error processing interlocutor ${interlocutor.name}:`,
            error,
          );
        }
      });
    } catch (error) {
      console.error("Error parsing interlocutor data:", error);
    }
  }

  /**
   * Share a callout (a pointed-at position plus whatever app data belongs
   * with it) with everyone in the room. Throttled to 10Hz.
   *
   * @param {boolean} visible
   * @param {THREE.Vector3|null} position
   * @param {object} [payload] - arbitrary JSON your app attaches (e.g. which
   *   path and point index the callout refers to)
   */
  sendCalloutUpdate(visible, position, payload = null) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    // Throttle updates
    const now = Date.now();
    if (now - this.lastCalloutSend < this.calloutThrottle) return;
    this.lastCalloutSend = now;

    const data = {
      v: 1,
      type: "callout",
      name: this.user.parameters.userName,
      visible: visible,
      position: position ? [position.x, position.y, position.z] : null,
      payload: payload,
    };
    this.socket.send(JSON.stringify(data));
  }

  receiveCalloutUpdate(data) {
    // The library doesn't know what a callout means in your app —
    // implement onCalloutUpdate(data) on your World to react to
    // { name, visible, position, payload }.
    this.experience.world?.onCalloutUpdate?.(data);
  }
}
