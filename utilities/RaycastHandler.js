import * as THREE from "three";
import Experience from "../Experience.js";
// import RaycastablePath from "../UI/RaycastablePath.js";

export default class RaycasterHandler {
  constructor(raycaster, color1 = 0x00ff00, color2 = 0xffff00) {
    this.experience = new Experience();
    this.color1 = color1;
    this.material = new THREE.MeshBasicMaterial({ color: color1 });
    this.color2 = color2;
    this.raycaster = raycaster;
    this.currentIntersect = null;

    //the lingeringSphere will hold the previous sphere object, and will tell it to die if trigger is pressed again.
    this.lingeringSphere = null;
  }

  handleRaycast() {
    const rawIntersects = this.raycaster.intersectObjects(
      this.experience.raycastableObjects,
      true
    );

    // process intersections to find raycastablepath parent
    let validIntersects = [];
    for (const intersect of rawIntersects) {
      let obj = intersect.object;
      // traverse up to find raycastablepath parent
      // use flag check instead of instanceof
      while (obj && !obj.isRaycastablePath && obj.parent) {
        if (obj.parent.isRaycastablePath) {
           obj = obj.parent;
           break;
        }
        obj = obj.parent;
      }
      
      if (obj.isRaycastablePath) {
        // found valid raycastablepath
        intersect.object = obj; // set intersect object to raycastablepath
        validIntersects.push(intersect);
      } else if (obj.active || obj.raycastable) {
         // other raycastable object
         validIntersects.push(intersect);
      }
    }

    // if there is any intersection
    if (validIntersects.length) {
      // if there is no current intersect, it's null, set one, and enter

      if (!this.currentIntersect) {
        // console.log("controller enter");
        if (this.material === undefined) {
          console.error("material enter undefined");
        }
        this.material.needsUpdate = true;
        
        this.currentIntersect = validIntersects[0];
        if (this.currentIntersect.object.raycastEnter) {
            this.currentIntersect.object.raycastEnter();
        }
        
        for (let i = 1; i < validIntersects.length; i++) {
          if (validIntersects[i].object.active && validIntersects[i].object.raycastExit) {
             validIntersects[i].object.raycastExit();
          }
        }
      } else {
        // there is a current intersect, check if the current intersect is the same as the new intersect
        if (this.currentIntersect.object.uuid === validIntersects[0].object.uuid) {
            // Same object, but we might need to update the hover marker position
             const hit = validIntersects[0];
             const obj = hit.object;
             if (obj.isRaycastablePath && obj.marker) {
                 //based on example: using pointOnLine for precise tracking
                 const p = hit.pointOnLine || hit.point;
                 if (p) obj.setSphere(p);
             }
        } else {
          // if it is not the same, exit the current intersect and set the new intersect
          if (this.currentIntersect.object.raycastExit) {
            this.currentIntersect.object.raycastExit();
          }
          this.currentIntersect = validIntersects[0];
          if (this.currentIntersect.object.raycastEnter) {
            this.currentIntersect.object.raycastEnter();
          }
          for (let i = 1; i < validIntersects.length; i++) {
             if (validIntersects[i].object.active && validIntersects[i].object.raycastExit) {
                 validIntersects[i].object.raycastExit();
             }
          }
        }
      }
    } else {
      // there is a no intersection, exit everything and set the current intersect to null
      if (this.currentIntersect) {
        if (!this.material) {
          console.error("material exit undefined");
        }
        this.material.needsUpdate = true;
       
        this.experience.raycastableObjects.forEach((r) => {
          if (r.hover && r.raycastExit) {
            r.raycastExit();
          }
        });
      }
      this.currentIntersect = null;
    }
  }

  activateCurrentIntersect() {
    this.eliminateLastSphere();
    if (this.currentIntersect) {
      try {
        if (this.currentIntersect.object.isRaycastablePath) {
          // based on threejs example: using pointOnLine for precise tracking
          const p = this.currentIntersect.pointOnLine || this.currentIntersect.point;
          this.currentIntersect.object.trigger(p);
          this.lingeringSphere = this.currentIntersect.object;
        } else {
          if (this.currentIntersect.object.trigger) {
             this.currentIntersect.object.trigger();
          }
        }
        // console.info(
        //   `${this.experience.user.name} triggered ${this.currentIntersect.object.name}`
        // );
      } catch (error) {
        console.log(this.currentIntersect);
        console.log("no trigger method on object", error);
      }
    } else {
      // console.log("no current intersect");
    }
  }
  eliminateLastSphere() {
    if (this.lingeringSphere != null) {
      this.lingeringSphere.hideSphere();
      this.lingeringSphere = null;
    }
  }
}
