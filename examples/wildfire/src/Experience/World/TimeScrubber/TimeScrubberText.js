import * as THREE from "three";
import Experience from "../..//Experience.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { depth } from "three/webgpu";

export default class TimeScrubber {
  constructor() {
    this.text = "00:00";
    this.font = null;

    this.experience = new Experience();
    this.resources = this.experience.resources;

    this.loadFont();

    this.createText();
  }
  loadFont() {
    this.font = this.resources.items.font; // Get the font from resources
    // console.log(this.font); // Debugging
  }
  createText() {
    if (this.textMesh) {
      // Remove old text before creating new one
      // this.experience.scene.remove(this.textMesh);
      this.textMesh.geometry.dispose(); // Dispose of old geometry
    }
    const textGeometry = new TextGeometry(this.text, {
      font: this.font,
      size: 0.5,
      depth: 0.1,
      curveSegments: 12,
    });
    // console.log(textGeometry); // Debugging

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
    this.textMesh.position.set(-3.8, 1.25, -5.5); // Position the text
    // this.experience.scene.add(this.textMesh);
  }
  updateText(newText) {
    this.text = newText; // Update the text string
    createText(); // Recreate the text mesh
  }
}
