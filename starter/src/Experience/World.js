import * as THREE from "three";
import { Experience, Environment, Floor, Stars, Selectable } from "brahma-xr";

/**
 * Your world. Everything you add to the scene lives here —
 * this is the file you edit.
 */
export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.environment = new Environment();
    this.floor = new Floor();
    this.stars = new Stars();

    // A selectable cube — hover and click it (or point at it in VR)
    this.cube = new Selectable(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
      "demo-cube",
      0x00ff88,
      0xff5566,
    );
    this.cube.position.set(0, 1, 0);
    this.scene.add(this.cube);

    // Assets declared in sources.js are available once ready fires:
    this.experience.resources.on("ready", () => {
      // const myData = this.experience.resources.items.myData;
    });
  }

  update() {
    // Called every frame
    this.cube.rotation.y += 0.005;
  }
}
