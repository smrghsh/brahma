import * as THREE from "three";
import Experience from "./Experience.js";

export default class User {
  constructor() {
    this.experience = new Experience();
    // this.debug = this.experience.debug;
    this.parameters = {
      userName: "User",
      color: null,
    };
    if (this.debug?.active) {
      this.debugFolder = this.debug.ui.addFolder("user");
      this.debugFolder.addColor(this.parameters, "color").onChange((value) => {
        this.parameters.color = value;
        console.log(` color parameter changed to ${this.parameters.color}`);
      });
      // set user name
      this.debugFolder.add(this.parameters, "userName").onChange((value) => {
        this.parameters.userName = value;
      });
    }
  }
  setUserName(userName) {
    this.userName = userName;
  }
  setColor(color) {
    console.log("user color set to", color);
    this.color = color;
  }
  getUserName() {
    return this.userName;
  }
  getColor() {
    return this.color;
  }
}
