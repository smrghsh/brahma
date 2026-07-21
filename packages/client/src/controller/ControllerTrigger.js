export default class ControllerTrigger {
  // Poorly named class as this accounts for both the primary trigger and the primary squeeze during its instantiation in PadControls.js
  // threshold   // the amount the controller has to be pressed in order for a press to register
  // pressUp     // true for the first frame after the trigger was released
  // pressDown   // true for the first frame after the button was pressed
  // isPressed   // true if the button is currently held down
  // pressAmount // 0 - 1 value of how much the trigger is currently held down

  constructor() {
    this.threshold = 0.5;
    this.pressUp = false;
    this.pressDown = false;
    this.isPressed = false;
    this.pressAmount = 0;
  }

  update(triggerButton) {
    if (triggerButton.value != undefined) {
      this.pressUp =
        !this.pressUp && this.isPressed && triggerButton.value < this.threshold;
      this.pressDown = !this.isPressed && triggerButton.value >= this.threshold;
      this.isPressed = triggerButton.value >= this.threshold;
      this.pressAmount = triggerButton.value;
    } else {
      // console.warn(
      //   "ControllerTrigger: Could not update trigger because triggerButton value was undefined"
      // );
    }
  }
}
