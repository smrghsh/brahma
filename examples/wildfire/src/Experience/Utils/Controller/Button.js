export default class Button {
  constructor() {
    this.pressUp = false;
    this.pressDown = false;
    this.isPressed = false;
  }

  update(isButtonPressed) {
    this.pressUp = !this.pressUp && this.isPressed && !isButtonPressed;
    this.pressDown = !this.isPressed && isButtonPressed;
    this.isPressed = isButtonPressed;
  }
}
