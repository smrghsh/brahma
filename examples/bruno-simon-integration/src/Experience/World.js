import * as THREE from "three";
import { Experience, Environment, Floor, Selectable } from "brahma-xr";

/**
 * Click (or point at, in XR) the sun to change the orbit speed —
 * a Selectable subclass reaching into the app's own Experience state.
 */
class Sun extends Selectable {
  constructor() {
    super(
      new THREE.IcosahedronGeometry(0.35, 1),
      new THREE.MeshStandardMaterial({ color: 0xffc857, flatShading: true }),
      "sun",
      0xffc857,
      0xffffff,
    );
  }

  onSelect() {
    const experience = new Experience();
    experience.orbitSpeed = experience.orbitSpeed > 1 ? 0.4 : 2.5;
    console.log(`sun selected — orbit speed now ${experience.orbitSpeed}`);
  }
}

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.environment = new Environment("#0b0b1a");
    this.floor = new Floor();

    this.sun = new Sun();
    this.sun.position.set(0, 1.4, 0);
    this.scene.add(this.sun);

    // Torus knots orbiting the sun at radii the camera's custom near/far
    // and damped orbit controls make pleasant to inspect up close
    this.pivots = [];
    const colors = [0x4fc3f7, 0xef5350, 0x81c784];
    colors.forEach((color, i) => {
      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.09, 0.03, 64, 8),
        new THREE.MeshStandardMaterial({ color }),
      );
      knot.position.x = 0.8 + i * 0.45;
      const pivot = new THREE.Group();
      pivot.position.y = 1.4;
      pivot.rotation.y = i * 2.1;
      pivot.add(knot);
      this.scene.add(pivot);
      this.pivots.push(pivot);
    });
  }

  update() {
    const dt = this.experience.time.delta / 1000;
    this.sun.rotation.y += dt * 0.2;
    this.pivots.forEach((pivot, i) => {
      pivot.rotation.y += dt * this.experience.orbitSpeed * (1 - i * 0.2);
    });
  }
}
