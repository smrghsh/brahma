import * as THREE from "three";
import Experience from "../../Experience";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";
import PadControls from "./PadControls";
import RaycasterHandler from "../RaycastHandler";
import Locomotion from "./Locomotion";

export default class Controller {
  constructor() {
    this.experience = new Experience();
    this.raycaster = new THREE.Raycaster();
    this.currentIntersect = null;
    this.raycasterHandler = new RaycasterHandler(this.raycaster);
    this.locomotion = new Locomotion();
    this.pointerActivationDelay = 250;
    this.pointerLastActivated = 0;
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

    this.createPointer();
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
      this.updateRaycaster();
      this.updatePointer();
      // Update locomotion
      this.locomotion.update();
    }
  }

  addConnectionListeners() {
    this.controller1.addEventListener("connected", (event) => {
      if (event.data.handedness === "right") {
        if (event.data.gamepad) {
          this.r_connection = true;
          this.controller1.padControls.gamepad = event.data.gamepad;
          this.rightController = this.controller1;
          this.raycaster.setFromXRController(this.rightController);
        } else {
          this.r_connection = false;
        }
      } else if (event.data.handedness === "left") {
        if (event.data.gamepad) {
          this.l_connection = true;
          this.controller1.padControls.gamepad = event.data.gamepad;
          this.leftController = this.controller1;
          this.raycaster.setFromXRController(this.leftController);
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

  createPointer() {
    this.pointerLength = 1;
    this.pointerRadius = 0.005;
    const pointer = new THREE.Mesh(
      new THREE.ConeGeometry(this.pointerRadius, this.pointerLength),
      new THREE.MeshStandardMaterial()
    );
    pointer.name = "pointer";
    pointer.rotation.x = -Math.PI / 2;
    pointer.position.z = -this.pointerLength / 2;
    pointer.visible = false;
    this.leftController.add(pointer.clone());
    this.rightController.add(pointer.clone());
  }

  init() {
    console.info(`[Controller.js (both controllers)] initialized`);
  }

  async updateRaycaster() {
    // set pointer controller to the controller that is currently pressing the trigger
    if (
      this.r_connection &&
      (this.rightController.padControls.primaryTrigger.pressDown ||
        this.rightController.padControls.buttons.top.pressDown)
    ) {
      this.pointerController = this.rightController;
    } else if (
      this.l_connection &&
      (this.leftController.padControls.primaryTrigger.pressDown ||
        this.leftController.padControls.buttons.top.pressDown)
    ) {
      this.pointerController = this.leftController;
    }
    // set raycaster to pointer controller
    this.raycaster.setFromXRController(this.pointerController);
  }

  async updatePointer() {
    if (this.pointerController === this.rightController) {
      this.rightController.getObjectByName("pointer").visible = true;
      this.leftController.getObjectByName("pointer").visible = false;
      this.pointer = this.rightController.getObjectByName("pointer");
    } else {
      this.rightController.getObjectByName("pointer").visible = false;
      this.leftController.getObjectByName("pointer").visible = true;
      this.pointer = this.leftController.getObjectByName("pointer");
    }

    this.raycasterHandler.handleRaycast();

    if (this.pointerController.padControls.primaryTrigger.isPressed) {
      // only do the following if the current time is greater than the last time the pointer was activated by the delay
      if (
        Date.now() - this.pointerLastActivated >
        this.pointerActivationDelay
      ) {
        this.pointerLastActivated = Date.now();
        this.raycasterHandler.activateCurrentIntersect();
      }
    }
  }
}
