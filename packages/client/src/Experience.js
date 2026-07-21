import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import EventEmitter from "./utilities/EventEmitter.js";
import Debug from "./utilities/Debug.js";
import Sizes from "./utilities/Sizes.js";
import Time from "./utilities/Time.js";
import Resources from "./utilities/Resources.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import User from "./networking/User.js";
import Networking from "./networking/Networking.js";
import Controller from "./controller/Controller.js";
import Pointer from "./Pointer.js";

let instance = null;

/**
 * The Experience singleton — the root of a brahma application.
 *
 * Subclass instances become THE experience: because the constructor returns
 * the existing instance, `new Experience()` anywhere (including inside every
 * brahma class) resolves to your app's instance, whether you use Experience
 * directly or extend it.
 *
 * @param {object} options
 * @param {HTMLCanvasElement} options.canvas - the canvas to render into
 * @param {Array<{name: string, type: string, path: string}>} [options.sources] - Resources manifest
 * @param {object} [options.camera] - { fov, near, far, position, lookAt, orbit: { damping } }
 * @param {object} [options.networking] - { url, room } for the brahma-xr-server to join
 * @param {object} [options.locomotion] - { floors } y-heights the teleport button cycles through
 * @param {boolean} [options.debug] - show the lil-gui debug panel (default: location hash is #debug)
 * @param {boolean} [options.xr] - enable WebXR and add the VRButton (default: true)
 */
export default class Experience extends EventEmitter {
  constructor(options = {}) {
    super();

    // Singleton pattern
    if (instance) {
      return instance;
    }
    instance = this;
    window.experience = this;

    this.canvas = options.canvas;
    if (!this.canvas) {
      throw new Error(
        "brahma-xr: new Experience({ canvas }) needs a canvas element",
      );
    }

    this.config = {
      camera: {
        fov: 35,
        near: 0.1,
        far: 1000,
        position: [-3.6277092514077784, 1.6242714732329864, 2.729361431631495],
        lookAt: [0, 0, 0],
        orbit: { damping: false },
        ...options.camera,
      },
      networking: { url: null, room: "default", ...options.networking },
      locomotion: { floors: [0, -5], ...options.locomotion },
      debug: options.debug ?? window.location.hash === "#debug",
      xr: options.xr ?? true,
    };

    this.debug = new Debug(this.config.debug);
    this.user = new User();

    /* Selectable Objects */
    this.selectableObjects = [];
    this.grabbableObjects = [];

    // Apps assign their own World after construction: experience.world = new World()
    this.world = null;

    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Resources(options.sources ?? []);
    this.cameraGroup = new THREE.Group();
    this.scene.add(this.cameraGroup);

    this.camera = new Camera();
    this.renderer = new Renderer();

    /*
      Pointer Section
    */
    this.pointer = new Pointer();
    this.pointer.setSource("camera", {
      camera: this.camera.instance,
      mouse: new THREE.Vector2(0, 0),
    });
    this.setDesktopPointerListeners();

    /** XR/Immersive Code */
    this.controller = new Controller();
    if (this.config.xr) {
      this.renderer.instance.xr.enabled = true;
      this.vrButton = VRButton.createButton(this.renderer.instance);
      document.body.appendChild(this.vrButton);
    }

    // setAnimationLoop runs on desktop too, and is the only loop that runs in XR
    this.renderer.instance.setAnimationLoop(() => {
      this.controller.update();
      if (this.networking?.canSendEmbodiment) {
        this.networking.sendEmbodiment(
          this.camera.instance.matrixWorld,
          this.controller.controller1.matrixWorld,
          this.controller.controller2.matrixWorld,
        );
      }
      this.renderer.instance.render(this.scene, this.camera.instance);
    });

    this.sizes.on("resize", () => {
      this.camera.resize();
      this.renderer.resize();
      this.trigger("resize");
    });
    this.time.on("tick", () => {
      this.update();
    });
    this.resources.on("ready", () => {
      this.trigger("ready");
    });

    if (this.debug.active && this.config.networking.url) {
      this.debug.ui
        .add({ joinSession: () => this.join() }, "joinSession")
        .name("Join Session");
    }
  }

  /**
   * Connect to a brahma-xr-server and start sharing embodiment.
   * Uses the url/room from the networking config unless a Networking
   * instance was already created with its own options.
   */
  join() {
    if (!this.networking) {
      this.networking = new Networking();
    }
    this.networking.connect();
    return this.networking;
  }

  update() {
    this.camera.update();
    if (!this.isXRActive()) {
      // this is executed when out of XR i.e. desktop
      this.cameraGroup.updateMatrixWorld();
      this.camera.instance.updateMatrixWorld();
      this.pointer.hover();
    }
    this.world?.update?.();
    this.trigger("tick");
  }

  isXRActive() {
    return this.renderer.instance.xr.isPresenting;
  }

  setDesktopPointerListeners() {
    this.onMouseMove = (event) => {
      const mouse = new THREE.Vector2(
        (event.clientX / this.sizes.width) * 2 - 1,
        -(event.clientY / this.sizes.height) * 2 + 1,
      );
      this.pointer.setSource("camera", {
        camera: this.camera.instance,
        mouse,
      });
    };
    this.onClick = () => {
      this.pointer.select();
    };
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("click", this.onClick);
  }

  destroy() {
    this.time.stop();
    this.sizes.dispose();
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("click", this.onClick);
    this.networking?.disconnect();
    this.renderer.instance.setAnimationLoop(null);

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        for (const key in child.material) {
          const value = child.material[key];
          if (value && typeof value.dispose === "function") {
            value.dispose();
          }
        }
      }
    });
    this.camera.controls.dispose();
    this.renderer.instance.dispose();
    if (this.debug.active) {
      this.debug.ui.destroy();
    }
    this.vrButton?.remove();
    if (window.experience === this) {
      delete window.experience;
    }
    instance = null;
  }
}
