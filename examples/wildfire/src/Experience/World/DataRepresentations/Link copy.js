import * as THREE from "three";
import Experience from "../../Experience";
import Calloutable from "../../UI/Calloutable";
import { MeshLineGeometry, MeshLineMaterial, raycast } from "meshline";

export default class Link extends Calloutable {
  constructor(id, maxMPH, roadType, coordinates) {
    // Generate the MeshLine from the coordinates
    const lineGeometry = new MeshLineGeometry();
    lineGeometry.setPoints(coordinates.flat()); // Flatten the coordinates array
    let roadColor;
    switch (roadType) {
      case "secondary":
        roadColor = 0x05dbf2;
        break;
      case "tertiary":
        roadColor = 0x07b0f2;
        break;
      case "residential":
        roadColor = 0x444df2;
        break;
      case "service":
        roadColor = 0x053959;
        break;
      default:
        roadColor = 0x730255;
    }
    // a function that, according to an MPH value, darkens a roadColor. 25 and below is no change, 70 would be 50% darker
    const mphModifier = (mph, roadColor) => {
      if (mph <= 25) {
        return roadColor;
      } else {
        let darkenedColor = roadColor - roadColor * 0.5;
        return darkenedColor;
      }
    };
    roadColor = mphModifier(maxMPH, roadColor);

    const lineMaterial = new MeshLineMaterial({
      color: roadColor,
      lineWidth: 0.1,
    });
    super(lineGeometry, lineMaterial, `Link-${id}`);
    // this.raycast = raycast; //temp disabling

    // console.log(raycast);
    this.experience = new Experience();
    this.projection = this.experience.world.geo.projection;
    this.scene = this.experience.scene;
    this.maxMPH = maxMPH;
    this.roadType = roadType;
    this.makeCalloutDisplay();
    this.updateCalloutDisplayPosition();
  }

  makeCalloutDisplay() {
    const calloutText = `Link ID: ${this.id}\nMax Speed: ${this.maxMPH} MPH\nRoad Type: ${this.roadType}`;

    const calloutPlaneGeometry = new THREE.PlaneGeometry(1, 0.5);
    const calloutPlaneMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    this.calloutPlane = new THREE.Mesh(
      calloutPlaneGeometry,
      calloutPlaneMaterial
    );

    // Calculate the midpoint of the middle line segment
    const middleIndex = Math.floor(this.geometry.attributes.position.count / 2);
    const middleStart = new THREE.Vector3().fromBufferAttribute(
      this.geometry.attributes.position,
      middleIndex - 1
    );
    const middleEnd = new THREE.Vector3().fromBufferAttribute(
      this.geometry.attributes.position,
      middleIndex
    );
    const midpoint = new THREE.Vector3()
      .addVectors(middleStart, middleEnd)
      .multiplyScalar(0.5);

    this.calloutPlane.position.copy(midpoint);
    this.calloutDisplay.add(this.calloutPlane);
  }

  updateCalloutDisplayPosition() {
    // Update the callout position and orientation based on the camera's position
    if (this.calloutPlane) {
      this.calloutPlane.position.set(
        this.position.x,
        this.position.y + 1,
        this.position.z
      );
      this.calloutPlane.lookAt(this.experience.camera.instance.position);
    }
  }
}
