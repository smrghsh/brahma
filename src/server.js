import fs from "fs";
import https from "https";
// import http from "http"; 
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import express from "express";
import cors from "cors";

export class BrahmaServer {
  constructor({
    port = 8080,
    certPath = "../cert/cert.pem",
    keyPath = "../cert/key.pem",
  } = {}) {
    console.log("Initializing BrahmaServer...");

    this.port = port;
    this.certPath = certPath;
    this.keyPath = keyPath;

    this.app = express();
    this.interlocutors = {};
    this.simulationTime = 0;
    this.simulationPlaying = false;
    this.simulationRate = 1;
    this.server = null;
    this.wss = null;
  }

    initialize() {

    // Load SSL/TLS certificate and private key
    const serverConfig = {
      cert: fs.readFileSync(
        "/etc/letsencrypt/live/brahma.xrss.org/fullchain.pem"
      ),
      key: fs.readFileSync("/etc/letsencrypt/live/brahma.xrss.org/privkey.pem"),
    };

    // Create HTTPS server
    this.server = https.createServer(serverConfig, this.app);
    // this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.app.use(cors());

    // API route to get unique username and color
    this.app.get("/uniqueUsernameAndColor", (req, res) => {
      const username = this._generateUsername();
      const color = this._generatePastelColor();
      res.json({ username, color });
    });

    // API route to get active interlocutors
    this.app.get("/activeInterlocutors", (req, res) => {
      res.json(this.interlocutors);
    });

    /**
     * The formalized protocol
     *
     * From one user, sent to client
     * embodiment (bad name)
     * name: String
     * color: String
     * HMDPosition: Mat4
     * LController: Mat4 // HMD position if desktop
     * RController: Mat4 // HMD position if desktop
     */

    this.wss.on("connection", (ws) => {
      console.log("Secure client connected");
      ws.on("message", (message) => {
        // console.log("Received: %s", message);
        try {
          const data = JSON.parse(message);

          if (data.name && data.color) {
            // this means with high confidence that the interlocutor is attempting to send name, color, and avatar embodiment data

            if (!this.interlocutors[data.name]) {
              // interlocutor introducing itself, as it doesn't exist yet in the interlocutors object
              this.interlocutors[data.name] = { name: data.name, color: data.color };
              this.interlocutors[data.name].timeJoined = Date.now();
              console.log(
                `New interlocutor created: ${data.name}, color: ${data.color}`
              );
            }

            if (data.HMDPosition && data.LController && data.RController) {
              // these three are what's used for avatar embodiment
              interlocutors[data.name].HMDPosition = data.HMDPosition;
              interlocutors[data.name].LController = data.LController;
              interlocutors[data.name].RController = data.RController;
              interlocutors[data.name].lastUpdated = Date.now();
              // i used to have code to clear inactive interlocutors
            }
            //&& data.simulationRate
          } else if (
            Object.hasOwn(data, "type") &&
            data.type == "timeCommand"
          ) {
            // here, or in a similar manner, you would handle other types of messages from the client
            // the client should also be able to update the timescrubber, callouts etc.
            this.simulationTime = data.simulationtime;
            this.simulationRate = data.simulationrate;
            this.simulationPlaying = data.simulationplaying;
            console.log(
              "Received time command: " +
                data.simulationtime +
                " " +
                data.simulationrate +
                " " +
                data.simulationplaying
            );
          } else {
            console.log("Invalid message: missing name or color");
          }
        } catch (error) {
          console.error("Error processing message from client:", error);
          ws.send("Error: Invalid message format");
        }
      });
      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });

    console.log("BrahmaServer (backend) initialized");
  }

  _generateUsername() {
    const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let username;
    do {
      username = "User-";
      for (let i = 0; i < 2; i++) {
        username += alphanumeric.charAt(
          Math.floor(Math.random() * alphanumeric.length)
        );
      }
    } while (Object.keys(this.interlocutors).includes(username)); // Ensure unique username
    return username;
  }

  _generatePastelColor() {
    const randomHex = () => Math.floor(Math.random() * 128 + 127); // Pastel color component
    const red = randomHex().toString(16).padStart(2, "0");
    const green = randomHex().toString(16).padStart(2, "0");
    const blue = randomHex().toString(16).padStart(2, "0");

    return `0x${red}${green}${blue}`;
  }

  _broadcast() {
    // for each interlocutor, if the lastUpdated is more than 5 minutes ago, delete them
    // const now = Date.now();
    // Object.keys(this.interlocutors).forEach((name) => {
    //   if (now - this.interlocutors[name].lastUpdated > 300000) {
    //     delete this.interlocutors[name];
    //   }
    // });
    let packet = Object.values(this.interlocutors).map(
      ({ name, color, HMDPosition, LController, RController }) => ({
        name,
        color,
        HMDPosition,
        LController,
        RController,
      })
    );

    packet = JSON.stringify(packet);

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(packet);
      }
    });
  }

  //This function takes care of sending any non-interlocutor data to the clients
  _broadcastTime() {
    let type = "timePacket";
    let timePacket = {
      type: type,
      simulationTime: this.simulationTime,
      simulationPlaying: this.simulationPlaying,
      simulationRate: this.simulationRate,
    };

    timePacket = JSON.stringify(timePacket);

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(timePacket);
      }
    });
  }

  run() {
    console.log("BrahmaServer is running...");

    // Start the HTTPS server on port 8080
    this.server.listen(8080, () => {
      console.log(`🛜 WebSocket server started on ws://localhost:${this.port}`);
    });
  }
}
