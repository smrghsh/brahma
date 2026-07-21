import EventEmitter from "./EventEmitter.js";

export default class Time extends EventEmitter {
  constructor() {
    super();

    // Setup
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;

    this.delta = 16;
    this.running = true;

    window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  tick() {
    if (!this.running) return;
    const currentTime = Date.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;
    this.trigger("tick");
    window.requestAnimationFrame(() => {
      this.tick();
    });
  }

  stop() {
    this.running = false;
  }
}
