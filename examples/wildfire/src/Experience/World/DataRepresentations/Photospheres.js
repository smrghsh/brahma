import * as THREE from "three";
import Experience from "../../Experience.js";

export default class Photospheres {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.photosphereGroup = new THREE.Group();
    this.geo = this.experience.world.geo;

    const geometry = new THREE.CylinderGeometry(4, 4, 4, 60, 1, true);
    geometry.scale(-1, 1, 1);

    // Initialize with default image source
    const defaultImageSource =
      "PhotosphereImages/stitched-38.076704_-122.841268_processed.jpg";
    const image = new Image();
    image.src = defaultImageSource;
    this.photosphereTexture = new THREE.Texture(image);
    this.photosphereMaterial = new THREE.MeshBasicMaterial({
      map: this.photosphereTexture,
    });
    this.photoSphereCylinder = new THREE.Mesh(
      geometry,
      this.photosphereMaterial
    );
    this.photoSphereCylinder.position.y = -3;
    image.addEventListener("load", () => {
      this.photosphereTexture.needsUpdate = true;
    });

    // Initialize plane with canvas texture
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.canvas.width = 600;
    this.canvas.height = 400;
    this.planeTexture = new THREE.CanvasTexture(this.canvas);
    this.updatePlaneTexture([38.076704, -122.841268]); // Default coordinates

    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.planeTexture,
        side: THREE.DoubleSide,
      })
    );
    this.plane.position.y = -5;
    this.plane.position.x = 2;
    this.plane.rotation.x = -Math.PI / 2;

    this.photosphereGroup.add(this.photoSphereCylinder);
    this.photosphereGroup.add(this.plane);
    this.scene.add(this.photosphereGroup);

    this.height = 1;
    this.width = 1;
  }

  displayPhotosphere(id = null) {
    this.photosphereGroup.visible = true;
  }

  hidePhotosphere() {
    this.photosphereGroup.visible = false;
    this.geo.geoGroup.visible = true;
  }

  togglePhotosphereVisibility() {
    if (this.photosphereGroup.visible) {
      this.hidePhotosphere();
    } else {
      this.displayPhotosphere();
    }
  }

  updatePlaneTexture(coordinates) {
    const [latitude, longitude] = coordinates;
    this.context.fillStyle = "#000000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = "#ffffff";
    this.context.font = "40px Arial";
    this.context.textAlign = "center";
    this.context.fillText(
      "via Google Maps API, 2024-12-11.",
      this.canvas.width / 2,
      100
    );
    this.context.fillText(`Latitude: ${latitude}`, this.canvas.width / 2, 200);
    this.context.fillText(
      `Longitude: ${longitude}`,
      this.canvas.width / 2,
      300
    );
    this.planeTexture.needsUpdate = true;
  }
  changePhotosphere(coordinates, imageSource) {
    // Update the photosphere texture
    const newImage = new Image();
    newImage.src = imageSource;
    newImage.addEventListener("load", () => {
      const newTexture = new THREE.Texture(newImage);
      newTexture.needsUpdate = true;
      this.photosphereMaterial.map = newTexture; // Update the material's map
      this.photosphereMaterial.needsUpdate = true; // Ensure material updates
    });

    // Update the plane texture
    this.updatePlaneTexture(coordinates);
  }
}
