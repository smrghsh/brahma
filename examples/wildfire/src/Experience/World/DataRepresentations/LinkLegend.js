import * as THREE from "three";
import Experience from "../../Experience.js";

export default class LinkLegend {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.linksLegend = new THREE.Group();
    this.scene.add(this.linksLegend);
    this.world = this.experience.world;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 300;
    canvas.height = 375;

    // Set background color to gray
    context.fillStyle = this.world.canvasBackgroundColor; // back color
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the title
    context.font = "40px Arial";
    context.fillStyle = this.world.canvasFontColor; // font color
    context.textAlign = "center";
    context.fillText("Link Types", canvas.width / 2, 50);

    this.roadTypes = this.convertColorMapToString(
      this.experience.world.colorMap
    );

    // Draw each road type with label and color square
    let yPosition = 100;
    const squareSize = 30;

    context.textAlign = "left";
    context.font = "30px Arial";
    for (const [type, color] of Object.entries(this.roadTypes)) {
      // Draw color square
      context.fillStyle = color;
      context.fillRect(50, yPosition - 20, squareSize, squareSize);

      // Draw label
      context.fillStyle = "#ffffff";
      context.fillText(type, 100, yPosition);

      yPosition += 50;
    }

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);

    // Create a material using the texture
    const legendMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    // Create geometry and mesh for the plane
    const legendGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    this.legend = new THREE.Mesh(legendGeometry, legendMaterial);

    this.legend.position.set(0.5, 1.85, -5.5);
    this.legend.scale.set(3, 3, 3);
    // Add the plane to the legend display group
    this.linksLegend.add(this.legend);
  }
  convertColorMapToString(colorMap) {
    const stringColorMap = {};
    for (const [key, value] of Object.entries(colorMap)) {
      // Convert the hexadecimal number to a string in the format "#RRGGBB"
      stringColorMap[key] = `#${value.toString(16).padStart(6, "0")}`;
    }
    return stringColorMap;
  }
}
