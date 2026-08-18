import { Experience as BrahmaExperience } from "brahma-xr";
import World from "./World.js";
import sources from "./sources.js";

/**
 * This app owns its Experience — the structure of every brahma research app
 * (seals, coral, aiwar-xr, RYR1). Because brahma's Experience is a
 * singleton, this subclass instance IS the experience: every brahma class
 * calling `new Experience()` internally gets this object back.
 *
 * The camera options below are the aiwar-xr story: that app forked Camera
 * and Renderer just to change near/far and orbit damping — now they're
 * constructor options.
 */
export default class Experience extends BrahmaExperience {
  constructor(canvas) {
    super({
      canvas,
      sources,
      camera: {
        fov: 45,
        near: 0.01,
        far: 5000,
        position: [3.2, 2.2, 3.2],
        orbit: { damping: true },
      },
      networking: {
        url: import.meta.env.VITE_BRAHMA_SERVER ?? "ws://localhost:8080",
        room: "bruno-simon-integration",
      },
    });
    // The singleton already existed — don't construct the app twice
    if (this.world) return;

    // Domain state the app owns, available everywhere via new Experience()
    this.orbitSpeed = 0.4;

    this.world = new World();
  }
}
