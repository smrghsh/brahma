import * as THREE from "three";
import Experience from "../../Experience";
import Calloutable from "../../UI/Calloutable";

export default class Agent extends Calloutable {
  constructor(
    geometry,
    material,
    name = "not named",
    initialColor,
    hoveredColor,
    positions = [0, 0, 0],
    metadata = {}
  ) {
    super(geometry, material, name, initialColor, hoveredColor);
  }
}
