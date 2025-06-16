import * as THREE from "three";

class RoundedBoxGeometry extends THREE.ExtrudeGeometry {
  constructor(width, height, depth, radius0, smoothness) {
    // Define the shape of the rounded box
    const shape = new THREE.Shape();

    const radius = Math.min(radius0, width / 2, height / 2, depth / 2);

    // Start at the top-right corner and draw a rectangle with rounded corners
    shape.moveTo(width / 2 - radius, height / 2);
    shape.lineTo(-width / 2 + radius, height / 2);
    shape.quadraticCurveTo(
      -width / 2,
      height / 2,
      -width / 2,
      height / 2 - radius
    );
    shape.lineTo(-width / 2, -height / 2 + radius);
    shape.quadraticCurveTo(
      -width / 2,
      -height / 2,
      -width / 2 + radius,
      -height / 2
    );
    shape.lineTo(width / 2 - radius, -height / 2);
    shape.quadraticCurveTo(
      width / 2,
      -height / 2,
      width / 2,
      -height / 2 + radius
    );
    shape.lineTo(width / 2, height / 2 - radius);
    shape.quadraticCurveTo(
      width / 2,
      height / 2,
      width / 2 - radius,
      height / 2
    );

    // Set the extrude settings
    const extrudeSettings = {
      steps: smoothness, // Smoothness affects the subdivision of the curved edges
      depth: depth,
      bevelEnabled: true,
      bevelThickness: radius,
      bevelSize: radius,
      bevelSegments: smoothness,
    };

    // Call the parent class constructor with the shape and extrude settings
    super(shape, extrudeSettings);
  }
}

export default RoundedBoxGeometry;
