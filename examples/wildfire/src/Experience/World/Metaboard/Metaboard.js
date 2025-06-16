import * as THREE from "three";
import Experience from "../../Experience.js";

export default class Metaboard {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug;
    this.createMetaboard();
    this.height = 1;
    this.width = 1;
  }

  createMetaboard() {
    const metaboardGeometry = new THREE.PlaneGeometry(10, 5, 10, 10);
    const metaboardMaterial = new THREE.MeshBasicMaterial({
      color: "beige",
      side: THREE.DoubleSide,
    });
    const metaboard = new THREE.Mesh(metaboardGeometry, metaboardMaterial);
    metaboard.position.set(10, 3, 0);
    //rotate 90 degrees around y to face center
    metaboard.rotation.y = Math.PI / 2;
    this.scene.add(metaboard);
  }
}
