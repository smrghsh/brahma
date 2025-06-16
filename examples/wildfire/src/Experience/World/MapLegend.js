import * as THREE from "three";
import Experience from "../Experience.js";

export default class MapLegend {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.mapLegend = new THREE.Group();
    this.scene.add(this.mapLegend);
    this.world = this.experience.world;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 450;
    canvas.height = 375;

    // Set background color to gray
    context.fillStyle = this.world.canvasBackgroundColor; // back color
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the title
    context.font = "40px Arial";
    context.fillStyle = this.world.canvasFontColor; // font color
    context.textAlign = "center";
    context.fillText("Map of Inverness, CA", canvas.width / 2, 75);

    // Satellite text
    context.font = "30px Arial";
    context.fillStyle = this.world.canvasFontColor; // font color
    context.textAlign = "left";
    context.fillText("Satellite and Topography", 35, 125);
    context.fillText("from Mapbox", 35, 165);
    //Long, Lat, Zoom
    context.font = "30px Arial";
    context.fillText("Latitude: 38.101", 35, 225);
    context.fillText("Longitude: -122.8569", 35, 265);
    context.fillText("Zoom: 14", 35, 305);

    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);

    // Create a material using the texture
    const legendMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    // Create geometry and mesh for the plane
    const legendGeometry = new THREE.PlaneGeometry(0.5, 0.41666);
    this.legend = new THREE.Mesh(legendGeometry, legendMaterial);

    this.legend.position.set(2.35, 1.725, -5.5);
    this.legend.scale.set(3, 3, 3);
    // Add the plane to the legend display group
    this.mapLegend.add(this.legend);
  }
}
