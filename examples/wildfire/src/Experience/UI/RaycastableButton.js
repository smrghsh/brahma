import * as THREE from "three";
import Experience from "../Experience";
import Raycastable from "./Raycastable";

export default class RaycastableButton extends Raycastable {
  constructor(
    geometry,
    material,
    name = "not named",
    color = 0x000000,
    activation = () => {
      console.log("No function assigned");
    }
  ) {
    super(geometry, material, name, color);
    this.pushable = true; //pushable refers to if the button can be pushed.
    this.pushed = false; //pushed refers to if it has been pushed. This should be used to change the state of the pause/play button.
    this.scene = this.experience.scene;
    this.activation = activation.bind(this);
    // console.log(this.activation);
    this.OGColor = color;
    if (this.material.length > 1) {
      this.material[4].color.set(color);
    } else {
      this.material.color.set(color);
    }

    this.scene.add(this);
    this.trigger = function () {
      console.log(this.name + " triggered");
      this.activation();
    };
  }
  raycastEnter() {
    this.hover = true;
    if (this.pushable) {
      if (this.material.length > 1) {
        this.material[4].color.set(0x333333);
      } else {
        this.material.color.set(0x333333);
      }
      this.experience.controller?.pointerController?.padControls.pulse(
        25,
        0.125
      );
    }
  }
  raycastExit() {
    this.hover = false;
    // maybe changes color back?
    if (this.pushable) {
      if (this.material.length > 1) {
        this.material[4].color.set(this.OGColor);
      } else {
        this.material.color.set(this.OGColor);
      }
    }
  }
  trigger() {
    console.log(this.name + triggered);
    if (this.activation) {
      this.activation();
    }
  }
}
