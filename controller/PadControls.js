import ControllerButtons from "./ControllerButtons";
import ControllerTrigger from "./ControllerTrigger";

export default class PadControls {
  // nicknamed PadControls, this actually facilitates all the gamepad controls.
  // Note!
  // Table of Button and xr-standard mapping
  // Button 	xr-standard Mapping
  // ------------------------------------------------
  // buttons[0] 	Primary trigger/button
  // buttons[1] 	Primary squeeze
  // buttons[2] 	Primary touchpad
  // buttons[3] 	Primary thumbstickf

  constructor(controller) {
    this.controller = controller;
    this.gamepad = null;
    this.buttons = new ControllerButtons(controller.name);
    this.primaryTrigger = new ControllerTrigger();
    this.primarySqueeze = new ControllerTrigger();
    this.thumbstick = { x: 0, y: 0 }; // Add this line
  }

  update() {
    if (this.gamepad) {
      this.buttons.update(this.gamepad.buttons);
      // https://github.com/immersive-web/webxr-gamepads-module/blob/main/gamepads-module-explainer.md
      // Gamepads module explainer

      if (this.gamepad.buttons.length >= 2) {
        this.primaryTrigger.update(this.gamepad.buttons[0]);
        this.primarySqueeze.update(this.gamepad.buttons[1]);
      } else {
        // console.warn(
        //   "PadControls: gamepad.buttons does not have the expected length."
        // );
      }

      // Update thumbstick state
      this.thumbstick.x = this.gamepad.axes[2] || 0; // Assuming axes[2] is the x-axis
      this.thumbstick.y = this.gamepad.axes[3] || 0; // Assuming axes[3] is the y-axis
    }
  }

  pulse(duration = 100, strength = 0.5) {
    if (this.gamepad && this.gamepad.hapticActuators?.length > 0) {
      this.gamepad.hapticActuators[0].pulse(strength, duration);
    }
  }
}
