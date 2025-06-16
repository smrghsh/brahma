import Button from "./Button";

export default class ControllerButtons {
  constructor(side) {
    this.x = new Button();
    this.y = new Button();
    this.a = new Button();
    this.b = new Button();
    if (side === "left") {
      this.top = this.y;
      this.bottom = this.x;
    } else {
      this.top = this.b;
      this.bottom = this.a;
    }
  }

  update(buttons) {
    if (buttons.length >= 5) {
      this.bottom.update(buttons[4].pressed);
      this.top.update(buttons[5].pressed);
    }
  }
}
