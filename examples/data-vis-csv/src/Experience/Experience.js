import { Experience as BrahmaExperience } from "brahma-xr";
import World from "./World.js";
import sources from "./sources.js";

/**
 * A data-vis app in the canonical brahma structure (seals-style): the CSV
 * declared in sources.js preloads through Resources, World renders it as
 * tracks of selectable points, and selecting a point shares a callout with
 * everyone in the room.
 */
export default class Experience extends BrahmaExperience {
  constructor(canvas) {
    super({
      canvas,
      sources,
      camera: {
        fov: 40,
        position: [4.5, 2.8, 4.5],
        lookAt: [0, 1.2, 0],
      },
      networking: {
        url: import.meta.env.VITE_BRAHMA_SERVER ?? "ws://localhost:8080",
        room: "data-vis-csv",
      },
    });
    // The singleton already existed — don't construct the app twice
    if (this.world) return;

    this.world = new World();
  }
}
