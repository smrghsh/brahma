import * as THREE from "three";
import Experience from "../Experience.js";

export default class RaycasterHandler {
  constructor(raycaster, color1 = 0x00ff00, color2 = 0xffff00) {
    this.experience = new Experience();
    this.color1 = color1;
    this.material = new THREE.MeshBasicMaterial({ color: color1 });
    this.color2 = color2;
    this.raycaster = raycaster;
    this.currentIntersect = null;
  }

  handleRaycast() {
    const intersects = this.raycaster.intersectObjects(
      this.experience.raycastableObjects
    );
    // if there is any intersection
    if (intersects.length) {
      // if there is no current intersect, it's null, set one, and enter
      if (!this.currentIntersect) {
        // console.log("controller enter");
        if (this.material === undefined) {
          console.error("material enter undefined");
        }
        this.material.needsUpdate = true; 
        // console.log("entering color:", this.material.color);
        //console.log(this.material.color);
        //console.log(`Color after entering: r=${this.material.color.r}, g=${this.material.color.g}, b=${this.material.color.b}`);
        this.currentIntersect = intersects[0];
        this.currentIntersect.object.raycastEnter();
        for (let i = 1; i < intersects.length; i++) {
          if (intersects[i].object.active) intersects[i].object.raycastExit();
        }
      } else {
        // there is a current intersect, check if the current intersect is the same as the new intersect
        if (this.currentIntersect.object.uuid === intersects[0].object.uuid) {
          // if it is the same, do nothing
        } else {
          // if it is not the same, exit the current intersect and set the new intersect
          this.currentIntersect.object.raycastExit();
          this.currentIntersect = intersects[0];
          this.currentIntersect.object.raycastEnter();
          for (let i = 1; i < intersects.length; i++) {
            if (intersects[i].object.active) intersects[i].object.raycastExit();
          }
        }
      }
    } else {
      // there is a no intersection, exit everything and set the current intersect to null
      if (this.currentIntersect) {
        // console.log("controller exit leave");
        if (!this.material) {
          console.error("material exit undefined");
        }
        this.material.needsUpdate = true; 
        // console.log("exiting color:", this.material.color);
        //console.log(`Color after exiting: r=${this.material.color.r}, g=${this.material.color.g}, b=${this.material.color.b}`);
        //console.error("material undefined");
        // this.currentIntersect.object.raycastExit();
        this.experience.raycastableObjects.forEach((r) => {
          if (r.hover) {
            r.raycastExit();
          }
        });
      }
      this.currentIntersect = null;
    }
  }

  activateCurrentIntersect() {
    if (this.currentIntersect) {
      try {
        this.currentIntersect.object.trigger();
        // console.info(
        //   `${this.experience.user.name} triggered ${this.currentIntersect.object.name}`
        // );
      } catch (error) {
        console.log(this.currentIntersect)
        console.log("no trigger method on object");
      }
    } else {
      console.log("no current intersect");
    }
  }
}
