import * as THREE from "three";
import Experience from "../../Experience.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";
import PadControls from "./PadControls";
import Locomotion from "./Locomotion";
import Grasp from "./Grasp";

export default class Controller {
  constructor() {
    this.experience = new Experience();
    this.locomotion = new Locomotion();
    this.grasp = new Grasp();
    this.pointerActivationDelay = 50;
    this.pointerLastActivated = 0;
    this.thumbstickScrubDelay = 30; // ms between scrub updates
    this.thumbstickLastScrubTime = 0;
    this.controller1 = this.experience.renderer.instance.xr.getController(0);
    this.controller2 = this.experience.renderer.instance.xr.getController(1);
    //instantiate Pad Controls
    this.controller1.padControls = new PadControls(this.controller1);
    this.controller2.padControls = new PadControls(this.controller2);
    //for handedness
    this.rightController = this.controller1;
    this.leftController = this.controller2;

    // the pointController contains a reference to the controller that is currently pressing the trigger
    // this is changed by the updateRaycaster function
    // this is used by the updatePointer function to render the pointer on the correct controller
    this.pointerController = this.rightController;

    this.rightController.name = "right";
    this.leftController.name = "left";

    this.experience.cameraGroup.add(this.leftController);
    this.experience.cameraGroup.add(this.rightController);

    this.locomotion = new Locomotion();

    this.r_connection = false;
    this.l_connection = false;
    this.addConnectionListeners();

    const controllerModelFactory = new XRControllerModelFactory();
    this.leftControllerGrip =
      this.experience.renderer.instance.xr.getControllerGrip(0);
    this.rightControllerGrip =
      this.experience.renderer.instance.xr.getControllerGrip(1);
    this.leftControllerGrip.add(
      controllerModelFactory.createControllerModel(this.leftControllerGrip)
    );
    this.rightControllerGrip.add(
      controllerModelFactory.createControllerModel(this.rightControllerGrip)
    );
    this.experience.cameraGroup.add(this.leftControllerGrip);
    this.experience.cameraGroup.add(this.rightControllerGrip);

    this.init();
  }

  update() {
    // if XR is active and at least one controller is connected, update
    // controller inputs, raycaster, and locomotion
    if (
      this.experience.isXRActive() &&
      (this.r_connection || this.l_connection)
    ) {
      this.leftController.padControls.update();
      this.rightController.padControls.update();
      this.updatePointer();
      // Update locomotion
      this.locomotion.update();
      // Update grasp
      this.grasp.update();
    }
  }

  addConnectionListeners() {
    this.controller1.addEventListener("connected", (event) => {
      if (event.data.handedness === "right") {
        if (event.data.gamepad) {
          this.r_connection = true;
          this.controller1.padControls.gamepad = event.data.gamepad;
          this.rightController = this.controller1;
        } else {
          this.r_connection = false;
        }
      } else if (event.data.handedness === "left") {
        if (event.data.gamepad) {
          this.l_connection = true;
          this.controller1.padControls.gamepad = event.data.gamepad;
          this.leftController = this.controller1;
        } else {
          this.l_connection = false;
        }
      }
    });

    // second controller connection listener
    this.controller2.addEventListener("connected", (event) => {
      if (event.data.handedness === "right") {
        if (event.data.gamepad) {
          this.r_connection = true;
          this.controller2.padControls.gamepad = event.data.gamepad;
          this.rightController = this.controller2;
        } else {
          this.r_connection = false;
        }
      } else if (event.data.handedness === "left") {
        if (event.data.gamepad) {
          this.l_connection = true;
          this.controller2.padControls.gamepad = event.data.gamepad;
          this.leftController = this.controller2;
        } else {
          this.l_connection = false;
        }
      }
    });
  }

  init() {
    console.info(`[Controller.js (both controllers)] initialized`);
  }

  async updatePointer() {
    // Always use right controller as default pointer (or left if right not connected)
    // This ensures consistent pointer behavior even when not pressing buttons
    if (this.r_connection) {
      this.pointerController = this.rightController;
    } else if (this.l_connection) {
      this.pointerController = this.leftController;
    }

    // Update pointer source and perform hover raycasting
    if (this.pointerController) {
      this.experience.pointer.setSource("controller", this.pointerController);
      this.experience.pointer.hover();

      // Handle selection on trigger press with cooldown
      if (
        this.pointerController.padControls.primaryTrigger.isPressed ||
        this.pointerController.padControls.buttons.top.isPressed
      ) {
        if (
          Date.now() - this.pointerLastActivated >
          this.pointerActivationDelay
        ) {
          this.pointerLastActivated = Date.now();
          this.experience.pointer.select();
        }
      }

      // Handle joystick scrubbing for callout
      const thumbstick = this.pointerController.padControls.thumbstick;
      const now = Date.now();

      if (Math.abs(thumbstick.x) > 0.5) {
        // Scrub continuously while held, throttled by delay
        if (now - this.thumbstickLastScrubTime > this.thumbstickScrubDelay) {
          if (thumbstick.x > 0) {
            this.experience.world.callout?.advancePoint();
          } else {
            this.experience.world.callout?.decrementPoint();
          }
          this.thumbstickLastScrubTime = now;
        }
      }
    }
  }
}
