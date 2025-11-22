import * as dat from "lil-gui";

export default class Debug {
  constructor() {
    // SWITCH TO TOGGLE DEBUG
    this.active = true;

    if (this.active) {
      this.ui = new dat.GUI();
    }
  }
}
