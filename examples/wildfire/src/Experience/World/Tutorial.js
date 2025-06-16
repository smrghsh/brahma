import * as THREE from "three";
import Experience from "../Experience.js";
import RaycastableButton from "../UI/RaycastableButton.js";

export default class Tutorial {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.cameraGroup = this.experience.cameraGroup;
    this.resources = this.experience.resources;

    this.debug = this.experience.debug;
    this.debugFolder = this.debug.ui.addFolder("Tutorial");
    this.showTutorial = true;
    // this.debugFolder.add(this, "setTutorial").name("Set Tutorial");

    this.tutorialGroup = new THREE.Group();
    // a rectangle the same aspect format as a slide presentation, 2m wide
    // it is black, with opacity .9
    // it is positioned at 0,0,4,and looksAt the this.cameraGroup.position
    this.tutorialPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1.125),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );

    this.slideManifest = ["titleSlide", "slide3", "slide4"];
    this.slideManifes = [];
    this.experience.camera.instance.updateMatrixWorld();

    // Get the camera’s world position
    const cameraWorldPos = new THREE.Vector3();
    this.experience.camera.instance.getWorldPosition(cameraWorldPos);
    this.tutorialGroup.add(this.tutorialPlane);
    this.tutorialGroup.lookAt(cameraWorldPos);
    this.tutorialGroup.position.set(0, 1, 0);

    // Make the tutorialPlane look at the camera

    this.slideManifest.forEach((e, i) => {
      const texture = this.resources.items[this.slideManifest[i]];
      console.log(texture);
      if (texture && texture instanceof THREE.Texture) {
        this.tutorialPlane.material.map = texture;
        this.tutorialPlane.material.color.set(0xffffff);
        this.tutorialPlane.material.needsUpdate = true;
      } else {
        console.warn("titleSlide texture not available yet.");
      }
      const button = new RaycastableButton(
        new THREE.PlaneGeometry(0.25, 0.25),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        }),
        `Slide ${i}`,
        0x000000,
        () => {
          this.setTutorialSlide(i);
        }
      );
      //   button.position.set from this.tutorialGroup.position
      button.position.set(
        this.tutorialGroup.position.x - 0.5 + i * 0.5,
        this.tutorialGroup.position.y - 0.5,
        this.tutorialGroup.position.z + 0.5
      );
      button.lookAt(this.experience.camera.instance.position);
    });

    this.scene.add(this.tutorialGroup);
    // this.tutorialGroup.visible = false;
  }

  setTutorialSlide(slideIndex = 0) {
    const texture = this.resources.items[this.slideManifest[slideIndex]];
    console.log(texture);
    if (texture && texture instanceof THREE.Texture) {
      this.tutorialPlane.material.map = texture;
      this.tutorialPlane.material.color.set(0xffffff);
      this.tutorialPlane.material.needsUpdate = true;
    } else {
      console.warn("titleSlide texture not available yet.");
    }
  }
}
