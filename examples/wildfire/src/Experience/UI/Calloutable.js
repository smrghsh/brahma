import * as THREE from "three";
import Experience from "../Experience";
import Raycastable from "./Raycastable";
import { log } from "three/webgpu";
export default class Calloutable extends Raycastable {
  constructor(
    geometry,
    material,
    name = "not named",
    initialColor,
    hoveredColor
  ) {
    super(geometry, material, name, initialColor, hoveredColor);
    this.calloutable = true;
    this.active = false;
    this.calloutDisplay = new THREE.Group();
    this.calloutDisplay.visible = false;
    this.makeCalloutDisplay();
    this.scene = this.experience.scene;
    this.scene.add(this.calloutDisplay);
  }
  raycastEnter() {
    this.hover = true;
    if (!this.active) {
      if (this.experience.user?.parameters.color) {
        this.material.color.set(
          parseInt(this.experience.user.parameters.color, 16)
        );
      } else {
        this.material.color.set(this.hoveredColor);
      }
      this.experience.controller?.pointerController?.padControls.pulse(
        25,
        0.125
      );
      this.calloutDisplay.visible = true;
      this.updateCalloutDisplayPosition();
    }
  }
  raycastExit() {
    this.hover = false;
    if (!this.active) {
      this.material.color.set(this.initialColor);
      this.calloutDisplay.visible = false;
    }
  }
  activate() {
    this.active = true;
    if (this.experience.user?.color) {
      this.material.color.set(this.experience.user.parameters.color);
    } else {
      this.material.color.set(this.hoveredColor);
    }
    this.experience.controller?.pointerController?.padControls.pulse(25, 0.2);
    this.calloutDisplay.visible = true;
    this.experience.raycastableObjects.forEach((object) => {
      if (object.calloutable && object !== this) {
        if (object.active) {
          object.deactivate();
        }
      }
    });
    this.updateCalloutDisplayPosition();

    // on activation check if networking is there. if so, attempt to contribute callout to network
    if (this.experience.networking) {
      this.experience.networking.contributeCallout(this.name);
    }
  }
  deactivate() {
    this.active = false;
    this.material.color.set(this.initialColor);
    this.calloutDisplay.visible = false;
    if (this.experience.networking) {
      this.experience.networking.rescindCallout(this.name);
    }
  }
  trigger() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
  makeCalloutDisplay() {
    // Create a canvas element to draw the text on it
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 256;

    // Set background color to gray
    context.fillStyle = "#000000"; // gray color
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    context.font = "40px Arial";
    context.fillStyle = "#ffffff"; // white text color
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw text (name) in the center of the canvas
    context.fillText(this.name, canvas.width / 2, canvas.height / 2);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);

    // Create a material using the texture
    const calloutPlaneMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    // Create geometry and mesh for the plane
    const calloutPlaneGeometry = new THREE.PlaneGeometry(0.5, 0.3);
    this.calloutPlane = new THREE.Mesh(
      calloutPlaneGeometry,
      calloutPlaneMaterial
    );

    // Set the position for the callout plane
    const position = new THREE.Vector3();
    position.copy(this.position);
    this.calloutPlane.position.set(position.x, position.y + 0.5, position.z);
    this.calloutPlane.scale.set(0.8, 0.8, 0.8);
    // Add the plane to the callout display group
    this.calloutDisplay.add(this.calloutPlane);
    // add a thin line to connect the callout to the object
    const lineGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0,
      0,
      0, // starting point
      0,
      0.5,
      0, // ending point
    ]);
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.calloutDisplay.add(line);
  }
  updateCalloutDisplayPosition() {
    this.calloutPlane.position.set(
      this.position.x,
      this.position.y + 0.5,
      this.position.z
    );
    const targetPosition = !this.experience.isXRActive()
      ? this.experience.camera.instance.position
      : this.experience.cameraGroup.position
          .clone()
          .add(new THREE.Vector3(0, 1, 0));

    this.calloutPlane.lookAt(targetPosition);
  }
}
