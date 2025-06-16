import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Experience from "./Experience.js";

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.cameraGroup = this.experience.cameraGroup;
    this.canvas = this.experience.canvas;
    this.setInstance();
    this.setOrbitControls();
  }
  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      35,
      this.sizes.width / this.sizes.height,
      0.1,
      1000
    );
    this.instance.position.set(0, 3, 8);
    this.instance.position.set(
      1.9974679051922597,
      6.443792065276432,
      6.655106551516807
    );

    this.instance.lookAt(new THREE.Vector3(0, 0, 0));
    this.cameraGroup.add(this.instance);
  }
  setOrbitControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    //this.controls.enableDamping = true;
    // this.controls.targe= new THREE.Vector3(0, 1, 1);
    //this.instance.lookAt(new THREE.Vector3(0, 1.8, -1));

    //this.controls.target = new THREE.Vector3(0, 1.8, 0);
  }
  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }
  update() {
    this.controls.update();

    // console.log(this.instance.position);
  }
}
