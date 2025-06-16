import * as THREE from "three";
import Debug from "./Utils/Debug.js";
import Sizes from "./Utils/Sizes.js";
import Time from "./Utils/Time.js";
import Resources from "./Utils/Resources.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import World from "./World/World.js";
import sources from "./sources.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import Controller from "./Utils/Controller/Controller.js";
import User from "./User.js";
import Networking from "./Utils/Networking.js";
import RaycasterHandler from "./Utils/RaycastHandler.js";
import { log } from "three/webgpu";

let instance = null;

export default class Experience {
  constructor(canvas) {
    // Singleton pattern
    if (instance) {
      return instance;
    }
    instance = this;
    window.experience = this;

    this.canvas = canvas;

    this.user = new User();
    /* Raycaster Code */
    this.raycastableObjects = [];
    /* Grabbing Code */
    this.grabbableObjects = [];

    this.raycaster = new THREE.Raycaster();
    this.raycasterHandler = new RaycasterHandler(this.raycaster);
    this.mouse = new THREE.Vector2();

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    window.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / sizes.width) * 2 - 1;
      this.mouse.y = -(event.clientY / sizes.height) * 2 + 1;
      1;
    });

    window.addEventListener("click", () => {
      this.raycasterHandler.activateCurrentIntersect();
    });

    // if (this.debug.active) {
    //   // this.debugFolder = this.debug.ui.addFolder("experience");
    //   this.debug.ui
    //     .add(
    //       {
    //         initNetworking: () => {
    //           window.experience.networking = new Networking();

    //           // hides Join Session after it's clicked
    //           this.debug.ui.domElement.style.display = "none";
    //         },
    //       },
    //       "initNetworking"
    //     )
    //     .name("Join Session");
    //   // add a button that does     this.networking = new Networking();
    // }

    this.sizes = new Sizes();
    this.time = new Time();
    this.clock = new THREE.Clock();
    this.lastTimeCalloutsUpdated = 0;
    this.calloutDelay = 1.2;
    this.scene = new THREE.Scene();
    // console.log("sources", sources);
    this.resources = new Resources(sources);
    this.debug = new Debug();
    this.cameraGroup = new THREE.Group();

    this.camera = new Camera();
    this.world = new World();

    this.renderer = new Renderer();

    /** XR/Immersive Code */
    this.scene.add(this.cameraGroup);
    this.controller = new Controller();
    this.renderer.instance.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(this.renderer.instance));
    this.renderer.instance.setAnimationLoop(() => {
      this.controller.update();
      if (this.networking?.canSendEmbodiment) {
        this.networking.sendEmbodiment(
          this.camera.instance.matrixWorld,
          this.controller.controller1.matrixWorld,
          this.controller.controller2.matrixWorld
        );
      }
      //abandoning this approach to receive callouts via RESTful
      // if (this.networking) {
      //   if (
      //     this.clock.getElapsedTime() - this.lastTimeCalloutsUpdated >
      //     this.calloutDelay
      //   ) {
      //     console.log("time to update callouts");
      //     this.networking.receiveCallouts();
      //     this.lastTimeCalloutsUpdated = this.clock.getElapsedTime();
      //   } else {
      //     console.log("not time to update callouts");
      //   }
      // }

      this.renderer.instance.render(this.scene, this.camera.instance);
    });

    this.sizes.on("resize", () => {
      this.resize();
      this.camera.resize();
      this.renderer.resize();
    });
    this.time.on("tick", () => {
      this.update();
    });

    // this.setupLoginPanel();
  }

  resize() {
    console.log("resized occured");
    this.camera.resize();
  }

  update() {
    this.camera.update();
    if (!this.isXRActive()) {
      // console.log("XR isn't active");
      this.raycaster.setFromCamera(this.mouse, this.camera.instance);
      this.raycasterHandler.handleRaycast();
      // console.log(this.camera.instance.matrixWorld);
      if (this.networking?.canSendEmbodiment) {
        this.networking.sendEmbodiment(
          this.camera.instance.matrixWorld,
          this.camera.instance.matrixWorld,
          this.camera.instance.matrixWorld
        );
      }
    } else {
      // this probably isn't working
      this.networking.sendEmbodiment(
        this.camera.instance.matrixWorld,
        this.controller.controller1.matrixWorld,
        this.controller.controller2.matrixWorld
      );
      console.log("im in headset");
    }
    this.world.update();
  }
  isXRActive() {
    return this.renderer.instance.xr.isPresenting;
  }
  destroy() {
    this.sizes.off("resize");
    this.time.off("tick");

    this.scene.traverse((child) => {
      // Test if it's a mesh
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        // Loop through the material properties
        for (const key in child.material) {
          const value = child.material[key];

          // Test if there is a dispose function
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
  }
}
