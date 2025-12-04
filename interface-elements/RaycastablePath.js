import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import Experience from "../../Experience.js";

export default class RaycastablePath extends THREE.Group {
  constructor(
    geometry,
    material,
    name = "not named",
    initialColor = 0x00ff00,
    hoveredColor = 0xff0000
  ) {
    super();

    // if you delete this line it will break
    this.isRaycastablePath = true; // (RaycastHandler -> RaycastablePath)

    this.initialColor = initialColor; // green (default)
    this.hoveredColor = hoveredColor; // red

    this.line = new Line2(geometry, material);
    this.line.computeLineDistances();
    this.add(this.line);

    this.name = name;

    this.experience = new Experience();
    this.experience.raycastableObjects.push(this);
    this.hover = false;
    this.raycastable = true;
    this.active = true;

    if (this.line.material && this.line.material.color) {
      this.initialColor = this.line.material.color.clone();
      this.line.material.color.set(this.initialColor);
    }

    // Remove this line, remove the marker and anything to do with that.
    this.spawnSphere();

    this.callout = new THREE.Group();
    this.stem = new THREE.Mesh(); // this a thin cylinder
    this.infomationPlane = new THREE.Mesh();
    this.callout.add(this.stem);
    this.callout.add(this.infomationPlane);
    // position, scale as needed to for the callout to look good.

    this.add(this.callout);

    this.callout.visible = false;
  }

  raycast(raycaster, intersects) {
    const localIntersects = [];
    this.line.raycast(raycaster, localIntersects);

    for (const hit of localIntersects) {
      hit.object = this; // set hit object to this wrapper
      intersects.push(hit);
    }
  }
  raycastEnter() {
    this.hover = true;
    if (this.line.material && this.line.material.color) {
      this.line.material.color.set(this.hoveredColor);
    }
    this.experience.controller?.pointerController?.padControls.pulse(25, 0.125);
    if (this.marker) this.marker.visible = true; // show marker on hover
    // find the intersection point as a 3D vecto, and place the callout there.
    // rotate the plane to face the camera.
  }
  raycastExit() {
    this.hover = false;
    if (this.line.material && this.line.material.color) {
      this.line.material.color.set(this.initialColor);
    }
    // hide the callout instead
    if (this.marker) this.marker.visible = false; // hide marker on exit
  }
  // keep trigger function but keep it empty
  trigger(location) {
    if (this.marker) {
      console.log(location);
      this.setSphere(location);
    }
  }
  // this should be removed
  spawnSphere() {
    // replacing this.marker new Seal()
    const geo = new THREE.SphereGeometry(0.004, 16, 16); // tiny sphere size
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: true,
    });
    this.marker = new THREE.Mesh(geo, mat);
    this.marker.visible = false;
    this.add(this.marker);
  }
  // this should be removed, however, you may or may not need to use this strategy for placing the callout
  setSphere(
    location //location is a 3d vector
  ) {
    this.marker.position.copy(location);
    this.worldToLocal(this.marker.position); // convert world position to local
    this.marker.visible = true;
  }
  // remove this. beacuse the callout can be toggled with this.callout.visible = false
  hideSphere() {
    this.marker.visible = false;
  }
}
