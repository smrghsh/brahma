import * as THREE from "three";
import Experience from "../Experience";
import RaycasterHandler from "../Utils/RaycastHandler";

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
  // dispose() {
  //   //TODO test, Copilot just hallucinated it
  //   this.experience.raycastableObjects =
  //     this.experience.raycastableObjects.filter((object) => object !== this);
  // }
}