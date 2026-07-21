import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Experience from "./Experience.js";

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.cameraGroup = this.experience.cameraGroup;
    this.canvas = this.experience.canvas;
    this.config = this.experience.config?.camera ?? {};
    this.setInstance();
    this.setOrbitControls();
  }

  setInstance() {
    const {
      fov = 35,
      near = 0.1,
      far = 1000,
      position = [-3.6277092514077784, 1.6242714732329864, 2.729361431631495],
      lookAt = [0, 0, 0],
    } = this.config;
    this.instance = new THREE.PerspectiveCamera(
      fov,
      this.sizes.width / this.sizes.height,
      near,
      far,
    );
    this.instance.position.set(...position);
    this.instance.lookAt(new THREE.Vector3(...lookAt));
    this.cameraGroup.add(this.instance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = this.config.orbit?.damping ?? false;
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
