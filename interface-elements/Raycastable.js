import * as THREE from "three";
import Experience from "../../Experience.js";
import RaycasterHandler from "../utilities/RaycastHandler";

export default class Raycastable extends THREE.Mesh {
  constructor(
    geometry,
    material,
    name = "not named",
    initialColor = 0x00ff00,
    hoveredColor = 0xff0000
  ) {
    super(geometry, material);
    this.initialColor = initialColor; // green (default)
    this.hoveredColor = hoveredColor; // red
    this.name = name;
    this.experience = new Experience();
    this.experience.raycastableObjects.push(this);
    this.hover = false;
    this.raycastable = true;
  }
  raycastEnter() {
    this.hover = true;
    this.material.color.set(this.hoveredColor);
    console.log(this.name + " hovered");
    this.experience.controller?.pointerController?.padControls.pulse(25, 0.125);
  }
  raycastExit() {
    this.hover = false;
    this.material.color.set(this.initialColor);
    console.log(this.name + " exited");
  }
  trigger() {
    console.log(this.name + triggered);
  }
}
