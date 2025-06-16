import * as THREE from "three";
import Experience from "../Experience.js";
import Environment from "./Environment.js";
import Floor from "./Floor.js";
import Stars from "./Stars.js";
import Geo from "./Geo.js";
import Photospheres from "./DataRepresentations/Photospheres.js";
import TimeScrubber from "./TimeScrubber/TimeScrubber.js";
import Raycastable from "../UI/Raycastable.js";
import Tutorial from "./Tutorial.js";
import LinkLegend from "./DataRepresentations/LinkLegend.js";
import MapLegend from "./MapLegend.js";
import CardinalityIndicator from "./CardinalityIndicator.js";
import PhotospherePortals from "./DataRepresentations/PhotospherePortals.js";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.floor = new Floor();

    // Links Color Map
    this.colorMap = {
      secondary: 0xb846f0,
      tertiary: 0x7d41f0,
      residential: 0x7dd5f0,
      service: 0x83a4f0,
      default: 0x3e3bf5,
    };

    //Color codes for canvas
    this.canvasFontColor = "#FFFFFF";
    this.canvasBackgroundColor = "#000000";

    // Wait for resources
    this.resources.on("ready", () => {
      // console.log("resources ready"); // used to be used to debug when or if resources were ready
      this.stars = new Stars();
      // this.tutorial = new Tutorial();
      this.geo = new Geo();
      this.environment = new Environment();
      this.photospheres = new Photospheres();
      this.linkLegend = new LinkLegend();
      this.mapLegend = new MapLegend();
      this.cardinalityIndicator = new CardinalityIndicator();
      this.cardinalityIndicator2 = new CardinalityIndicator();
      this.cardinalityIndicator2.scale.set(0.4, 0.4, 0.4);
      this.cardinalityIndicator2.position.set(0, -4.5, 0);
      this.scene.add(this.cardinalityIndicator);
      this.scene.add(this.cardinalityIndicator2);
      this.photospherePortals = new PhotospherePortals();
    });
  }
  update() {} //unused
}
