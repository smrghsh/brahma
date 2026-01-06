import * as THREE from "three";
import Experience from "../../Experience.js";

export default class Grasp {
  constructor() {
    this.experience = new Experience();
    this.grabbedObject = null; // The object currently being grabbed
    this.isGrabbing = false; // Whether an object is being grabbed
    this.controllerBoundingBox = new THREE.Box3(); // Controller bounding box for detecting intersections
    // this.axesHelper = new THREE.AxesHelper(0.1); // Axes helper for debugging
    // this.experience.scene.add(this.axesHelper);
    this.graspOffset = new THREE.Vector3(); // Offset between controller and grabbed object
    this.graspQuaternionOffset = new THREE.Quaternion(); // Offset between controller and grabbed object
  }

  update() {
    const controller = this.experience.controller.pointerController;
    const padControls = controller.padControls;
    const controllerPosition = new THREE.Vector3();
    const controllerQuaternion = new THREE.Quaternion();
    controller.getWorldPosition(controllerPosition);
    controller.getWorldQuaternion(controllerQuaternion);
    // this.axesHelper.position.copy(controllerPosition);

    // Check for intersections with grabbable objects using bounding boxes
    let intersectedObject = null;
    // this.experience.grabbableObjects.forEach((grabbable) => {
    //   // console.log("Controller position:", controllerPosition);
    //   // console.log(`${grabbable.name}'s bounding box:`, grabbable.boundingBox);

    //   // Update the bounding box of the grabbable object to account for movement
    //   grabbable.updateBoundingBox();

    //   // if controllerPosition is within the bounding box of the grabbable object
    //   if (grabbable.boundingBox.containsPoint(controllerPosition)) {
    //     intersectedObject = grabbable;
    //     console.log(`${grabbable.name} is intersected`);
    //   }
    // });

    // If the top button is pressed and an object is intersected, grab the object
    if (
      padControls.buttons.top.pressDown &&
      intersectedObject &&
      !this.isGrabbing
    ) {
      this.graspOffset.subVectors(
        intersectedObject.position,
        controllerPosition
      );
      this.startGrabbing(intersectedObject, controller);
    }

    // If the top button is released and currently grabbing, release the object
    if (padControls.buttons.top.pressUp && this.isGrabbing) {
      this.stopGrabbing(controller);
    }

    // If grabbing, keep the object following the controller
    if (this.isGrabbing && this.grabbedObject) {
      // grabbedObject worldMatrix set to controller worl,d matrix
      this.grabbedObject.position.copy(controllerPosition);
      this.grabbedObject.position.add(this.graspOffset);
      this.grabbedObject.quaternion.copy(controllerQuaternion);
    }
  }

  // Start grabbing the object
  startGrabbing(object, controller) {
    this.grabbedObject = object;
    this.isGrabbing = true;

    this.grabbedObject.onGrabStart(); // Call the grab start handler (corrected method name)
    console.log(`${this.grabbedObject.name} is now being grabbed`);
  }

  // Stop grabbing the object
  stopGrabbing(controller) {
    if (this.grabbedObject) {
      this.grabbedObject.onGrabEnd(); // Call the grab end handler (corrected method name)
      console.log(`${this.grabbedObject.name} has been released`);
    }
    this.isGrabbing = false;
    this.grabbedObject = null;
  }
}
