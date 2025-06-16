import * as THREE from "three";
import Experience from "../Experience.js";

export default class Interlocutors {
  constructor() {
    this.experience = new Experience();
    this.networking = this.experience.networking;
    this.bodies = {};
    this.boxGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.15);
    this.handGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.12);
  }
  purgeEmbodiment(name) {
    if (this.bodies.hasOwnProperty(name)) {
      this.experience.scene.remove(this.bodies[name].group);
      delete this.bodies[name];
    }
  }
  containsEmbodiment(name) {
    return this.bodies.hasOwnProperty(name);
  }
  instantiateEmbodiment(name, color) {
    console.log("instantiating embodiment", name);
    if (name == this.experience.user.parameters.userName) {
      return;
    }
    console.log(color);
    this.bodies[name] = {};
    this.bodies[name].group = new THREE.Group();
    this.bodies[name].material = new THREE.MeshBasicMaterial({
      color: color,
    });

    this.bodies[name].head = new THREE.Mesh(
      this.boxGeometry,
      this.bodies[name].material
    );
    this.bodies[name].head.name = "HMD";
    this.bodies[name].head.position.set(0, 0.1, 0);

    this.bodies[name].group.add(this.bodies[name].head);
    this.experience.scene.add(this.bodies[name].group);
    // same for LController and RController

    this.bodies[name].LController = new THREE.Mesh(
      this.handGeometry,
      this.bodies[name].material
    );
    this.bodies[name].LController.name = "LController";
    this.bodies[name].LController.position.set(0.1, 0, 0);
    this.bodies[name].group.add(this.bodies[name].LController);

    this.bodies[name].RController = new THREE.Mesh(
      this.handGeometry,
      this.bodies[name].material
    );
    this.bodies[name].RController.name = "RController";
    this.bodies[name].RController.position.set(-0.1, 0, 0);
    this.bodies[name].group.add(this.bodies[name].RController);
  }
  updateEmbodiment(
    name,
    HMDMatrix = new THREE.Matrix4(),
    LControllerMatrix = new THREE.Matrix4(),
    RControllerMatrix = new THREE.Matrix4()
  ) {
    if (name == this.experience.user.parameters.userName) {
      return;
    }
    let body = this.bodies[name];
    // HMD is a child of body.group named HMD
    // console.log(HMDMatrix);
    let HMD = body.group.getObjectByName("HMD");
    // set HMD from Matrix
    HMD.position.setFromMatrixPosition(HMDMatrix);
    HMD.quaternion.setFromRotationMatrix(HMDMatrix);
    // same for LController and RController
    let LController = body.group.getObjectByName("LController");
    LController.position.setFromMatrixPosition(LControllerMatrix);
    LController.quaternion.setFromRotationMatrix(LControllerMatrix);

    let RController = body.group.getObjectByName("RController");
    RController.position.setFromMatrixPosition(RControllerMatrix);
    RController.quaternion.setFromRotationMatrix(RControllerMatrix);
  }
}
