import * as THREE from "three";
import ThreeGeo from "../Utils/ThreeGeo/index.js";
import Links from "./DataRepresentations/Links.js";
import Agents from "./DataRepresentations/Agents.js";
import Elevation from "../Utils/ThreeGeo/elevation.js"; // import Elevation class
import PhotospherePortals from "./DataRepresentations/PhotospherePortals.js";
import Experience from "../Experience";
// ThreeGeo used to be imported here as an external library, we modifed it to be imported from our modified version
export default class Geo {
  // Geo is the class that has the data representation of cartographic data.
  constructor() {
    this.tgeo = new ThreeGeo({
      tokenMapbox:
        "pk.eyJ1Ijoic2dob3NoMTciLCJhIjoiY2x4bTd0ajcxMDB4ejJyb2lsb2M5OTlqeCJ9.FJRCbhHv9jEaKZ_O87Rz4w",
    });
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.geoGroup = new THREE.Group();

    this.resources = this.experience.resources;
    this.debug = this.experience.debug;
    // add a debug folder. there should be a dropdown menu to select several different parameters. The parameters are:
    // satellite, road, vegetation
    // const params = {
    //   view: "Satellite", // Default value
    // };

    // this.debugFolder = this.debug.ui.addFolder("Geo");
    // // dropdown
    // this.debugFolder
    //   .add(params, "view", ["Satellite", "Road", "Vegetation"])
    //   .name("View Type")
    //   .onChange((view) => {
    //     console.log(view);
    //   });

    this.scaling = new THREE.Vector3(8, 8, 8);
    this.origin = [38.101, -122.8569];
    this.radius = 4.0;
    this.zoom = 14;

    this.loadTerrain().then(() => {
      // console.log("loaded terrain");
      // the agents used to be placed here, but now its just done within the getTerrain function
      this.scene.add(this.geoGroup);
    });
  }
  async loadTerrain() {
    console.log("loading terrain...");
    const terrain = await this.tgeo.getTerrainRgb(
      this.origin, // [lat, lng]
      this.radius, // radius of bounding circle (km)
      this.zoom
    ); // zoom resolution
    this.projection = this.tgeo.getProjection(this.origin, this.radius);
    this.links = new Links(this.projection);
    this.scene.add(this.links);
    this.agents = new Agents(this.projection);
    this.scene.add(this.agents);
    this.photospherePortals = new PhotospherePortals(this.projection);

    //rotate around X 90
    terrain.rotation.x = -Math.PI / 2;
    // scale it up 10x
    terrain.scale.copy(this.scaling);

    this.geoGroup.add(terrain);
  }
}
