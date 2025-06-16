import * as THREE from "three";
import Experience from "../../Experience";
// import Raycastable from "../UI/Raycastable";
// import { linksData as linksData } from "../Data/Links/LinksData.js";
// meshline
import Link from "./Link";
export default class Links extends THREE.Group {
  constructor(projection) {
    super();
    this.experience = new Experience();
    this.geo = this.experience.world.geo;
    this.scene = this.experience.scene;
    this.projection = this.experience.world.geo.projection;
    this.bbox = this.projection.bbox;
    this.linksGroup = new THREE.Group();
    this.scene.add(this.linksGroup);

    this.addLinks();
  }

  isWithinBoundingBox([lat, lng]) {
    // Assuming bbox is defined as [minLng, minLat, maxLng, maxLat]
    const [minLng, minLat, maxLng, maxLat] = this.bbox;

    // Calculate the margin in degrees (1 mile ≈ 1.60934 km)
    const mileInKm = 1.60934;
    const earthRadiusKm = 6371; // Approximate radius of Earth in kilometers
    const kmPerDegree = (2 * Math.PI * earthRadiusKm) / 360; // Approximation for 1 degree of latitude/longitude
    const mileInDegrees = mileInKm / kmPerDegree;

    return (
      lng >= minLng - mileInDegrees &&
      lng <= maxLng + mileInDegrees &&
      lat >= minLat - mileInDegrees &&
      lat <= maxLat + mileInDegrees
    );
  }

  async addLinks() {
    const scaling = this.experience.world.geo.scaling;
    console.log("fetching Links.json");
    const response = await fetch("Links.json", {
      headers: {
        Accept: "application/json",
      },
    });
    const linksData = await response.json();
    const linkIds = Object.keys(linksData);
    console.log(`fetched ${linkIds.length} links`);

    linkIds.forEach((linkId) => {
      const linkData = linksData[linkId];

      // Check if any part of the link is within the bounding box (including the margin).
      const isInBounds = linkData.geometry.some(([lat, lng]) =>
        this.isWithinBoundingBox([lat, lng])
      );
      if (!isInBounds) return;

      const vertices = [];

      linkData.geometry.forEach(([lat, lng]) => {
        const [x, z] = this.projection.proj([lat, lng]);
        vertices.push(new THREE.Vector3(x * scaling.x, 0.3, -z * scaling.z));
      });
      const link = new Link(
        linkId,
        linkData.maxMPH,
        linkData.linkType,
        vertices
      );
      this.linksGroup.add(link);
    });
    this.linksGroup.scale.y = 1;
    this.linksGroup.position.y += 0.3;
  }
}
