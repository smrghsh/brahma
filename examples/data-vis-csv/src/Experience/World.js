import * as THREE from "three";
import { Experience, Environment, Floor, Selectable } from "brahma-xr";
import Callout from "./Callout.js";

const TRACK_COLORS = [0x4fc3f7, 0xffb74d, 0xba68c8];

/**
 * A selectable sphere at one CSV row. Hover highlights it; selecting it
 * places your callout there and shares it with the room.
 */
class DataPoint extends Selectable {
  constructor(track, index, color) {
    super(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshBasicMaterial({ color }),
      `track${track}-point${index}`,
      color,
      0xffffff,
    );
    this.track = track;
    this.index = index;
  }

  onSelect() {
    new Experience().world.showCalloutAt(this.track, this.index);
  }
}

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.environment = new Environment("#020210");
    this.floor = new Floor();

    this.tracks = []; // [{ rows, line }] per CSV track
    this.remoteCallouts = {}; // userName -> { callout, data }

    this.localCallout = new Callout(0xffffff);
    this.scene.add(this.localCallout);

    this.experience.resources.on("ready", () => {
      this.buildTracks(this.experience.resources.items.diveTracks);
    });
  }

  buildTracks(csvText) {
    const [header, ...lines] = csvText.trim().split("\n");
    const columns = header.split(",");
    const rows = lines.map((line) => {
      const values = line.split(",");
      return Object.fromEntries(
        columns.map((c, i) => [c, Number.parseFloat(values[i])]),
      );
    });

    for (const row of rows) {
      this.tracks[row.track] ??= { rows: [] };
      this.tracks[row.track].rows.push(row);
    }

    this.tracks.forEach((track, t) => {
      const color = TRACK_COLORS[t % TRACK_COLORS.length];
      const points = track.rows.map((r) => new THREE.Vector3(r.x, r.y, r.z));
      track.line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color }),
      );
      this.scene.add(track.line);

      // A selectable sphere every few samples keeps raycasting cheap
      track.rows.forEach((row, i) => {
        if (i % 4 !== 0) return;
        const point = new DataPoint(t, i, color);
        point.position.set(row.x, row.y, row.z);
        this.scene.add(point);
      });
    });
  }

  /** Place your callout on a CSV row and share it with the room. */
  showCalloutAt(trackIndex, pointIndex) {
    const row = this.tracks[trackIndex]?.rows[pointIndex];
    if (!row) return;
    const position = new THREE.Vector3(row.x, row.y, row.z);
    this.localCallout.show(position, `${row.temp.toFixed(1)} °C`);
    this.experience.networking?.sendCalloutUpdate(true, position, {
      track: trackIndex,
      index: pointIndex,
      temp: row.temp,
    });
  }

  /** Callouts other users share arrive here (see Networking). */
  onCalloutUpdate(data) {
    let remote = this.remoteCallouts[data.name];
    if (!data.visible) {
      if (remote) {
        this.scene.remove(remote.callout);
        delete this.remoteCallouts[data.name];
      }
      return;
    }
    if (!remote) {
      remote = { callout: new Callout(0x88ff88) };
      this.scene.add(remote.callout);
      this.remoteCallouts[data.name] = remote;
    }
    remote.data = data;
    const temp = data.payload?.temp;
    remote.callout.show(
      new THREE.Vector3(...data.position),
      `${data.name} · ${typeof temp === "number" ? temp.toFixed(1) : "?"} °C`,
    );
  }

  update() {
    const dt = this.experience.time.delta / 1000;
    this.localCallout.update(dt);
    for (const { callout } of Object.values(this.remoteCallouts)) {
      callout.update(dt);
    }
  }
}
