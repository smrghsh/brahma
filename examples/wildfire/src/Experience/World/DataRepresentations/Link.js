import * as THREE from "three";
import Experience from "../../Experience";
import Calloutable from "../../UI/Calloutable";

export default class Link extends THREE.Mesh {
  constructor(id, maxMPH, roadType, coordinates) {
    // Create a smooth curve from the coordinates
    const curve = new THREE.CatmullRomCurve3(coordinates);
    const experience = new Experience();
    // // Tube geometry along the curve
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.03, 8, false); // Adjust segments, radius, and radial segments as needed

    // // Apply scaling to flatten the geometry
    tubeGeometry.scale(1, 0.05, 1); // Make the height (y-axis) smaller to flatten it
    let roadColor = experience.world.colorMap[roadType];
    if (!roadColor) {
      roadColor = experience.world.colorMap.default;
    }
    // Function to darken the road color based on the MPH
    const mphModifier = (mph, roadColor) => {
      if (mph <= 25) {
        return roadColor;
      } else {
        return roadColor - roadColor * 0.5;
      }
    };
    roadColor = mphModifier(maxMPH, roadColor);

    // Create a standard material for the tube
    const tubeMaterial = new THREE.MeshToonMaterial({
      color: roadColor,
      depthWrite: false,
      opacity: 0.45,
      transparent: true,
    });

    // Call the super constructor with the new geometry and material
    super(tubeGeometry, tubeMaterial, `Link-${id}`);

    this.experience = new Experience();
    this.projection = this.experience.world.geo.projection;
    this.scene = this.experience.scene;
    this.maxMPH = maxMPH;
    this.roadType = roadType;
  }
  raycastEnter() {
    return;
  }
  raycastExit() {
    return;
  }
}
