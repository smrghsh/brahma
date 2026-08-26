import * as dat from "lil-gui";

export default class Debug {
  constructor(active = window.location.hash === "#debug") {
    this.active = active;

    if (this.active) {
      this.ui = new dat.GUI();
    }
  }
}
