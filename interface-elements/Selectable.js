import * as THREE from "three";
import Experience from "../../Experience.js";

export default class Selectable extends THREE.Mesh {
  constructor(
    geometry = new THREE.BoxGeometry(1, 1, 1),
    material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    name = "not named",
    initialColor = 0x00ff00,
    hoveredColor = 0xff0000
  ) {
    super(geometry, material);
    this.initialColor = initialColor; // green (default)
    this.hoveredColor = hoveredColor; // red
    this.name = name;
    this.experience = new Experience();
    this.experience.selectableObjects.push(this);
    this.hover = false;
    this.selectable = true;
  }
  onHover() {
    this.hover = true;
    this.material.color.set(this.hoveredColor);
    this.material.needsUpdate = true;
    console.log(this.name + " hovered");
  }
  onUnhover() {
    this.hover = false;
    this.material.color.set(this.initialColor);
    this.material.needsUpdate = true;
    console.log(this.name + " exited");
  }
  onSelect() {
    console.log(this.name + " selected");
  }
}
