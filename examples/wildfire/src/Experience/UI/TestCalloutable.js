import * as THREE from "three";
import Experience from "./Experience.js";
import Calloutable from "./UI/Calloutable.js";

export default class TestCalloutable extends Calloutable {
  constructor(
    geometry,
    material,
    name = "not named",
    color = 0xff0000,
    metadata = {}
  ) {
    super(geometry, material, name, color);
  }
}
