import * as THREE from "three";
import Experience from "../../Experience";
import RaycastableButton from "../../UI/RaycastableButton";

export default class PhotospherePortals {
  constructor(projection) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.world = this.experience.world;
    this.projection = this.experience.world.geo.projection;
    this.scaling = this.experience.world.geo.scaling;

    this.portals = new THREE.Group();
    this.firstBatch = [
      [38.0972703, -122.8583136],
      [38.0971987, -122.8548932],
      [38.1011265, -122.856534],
      [38.1104179, -122.8703214],
      [38.1080438, -122.881455],
      [38.1117513, -122.8688441],
      [38.0766816, -122.831062],
      [38.110736349999996, -122.8687915],
      [38.0898131, -122.8439058],
      [38.076704, -122.841268],
      [38.1076287, -122.8659997],
      [38.0868905, -122.8404616],
      [38.0858237, -122.8387537],
      [38.0889414, -122.8427006],
      [38.1084546, -122.8812669],
    ];
    //portals look like flattened spheres
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    geometry.scale(1, 0.05, 1);
    this.firstBatch.forEach((coordinates) => {
      try {
        //

        const [x, z] = this.projection.proj([coordinates[0], coordinates[1]]);
        const portal = new RaycastableButton(
          geometry,
          new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
          "Portal " + coordinates[0] + ", " + coordinates[1],
          0x00ff00,
          () => {
            console.log(this.getFilenameFromCoordinates(coordinates));
            try {
              this.world.photospheres.changePhotosphere(
                coordinates,
                this.getFilenameFromCoordinates(coordinates)
              );
            } catch (e) {
              console.error(e);
            }
            // if XR active
            if (this.experience.isXRActive()) {
              try {
                this.experience.cameraGroup.position.set(0, -5, 0);
              } catch (e) {
                console.error(e);
              }
            }
          }
        );
        portal.position.set(x * this.scaling.x, 0.3, -z * this.scaling.z);
      } catch (e) {
        console.error(e);
      }
    });
    this.scene.add(this.portals);
  }
  getFilenameFromCoordinates(coordinates) {
    //static/PhotosphereImages/stitched-38.076704_-122.841268_processed.jpg
    const lat = coordinates[0];
    const lng = coordinates[1];
    return `/PhotosphereImages/stitched-${lat}_${lng}_processed.jpg`;
  }
}
