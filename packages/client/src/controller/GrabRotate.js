import * as THREE from "three";
import Experience from "../Experience.js";

/**
 * Pinch-anywhere grab rotation for a hand-held object — the Locomotion.js
 * grab-and-pull, re-aimed at an Object3D. Pinch (or system-pinch on Apple
 * Vision Pro), then translate: the object rotates as if its surface were
 * glued to your fingertips.
 *
 *   r̂    = direction from object centre to the grab point
 *   d_t  = hand delta with the radial component removed
 *   axis = r̂ × d_t,   angle = |d_t| / radius
 *
 * The anchor re-baselines every frame (exact, drift-free, no feedback from
 * the object's own motion), and release hands the recent average angular
 * velocity to the object as damped momentum. Built for scientific
 * visualization: globes, molecules, point-cloud scans.
 *
 * Usage — self-registers with `experience.hands`, no per-frame wiring:
 *
 *   this.grab = new GrabRotate(this.globe, { handedness: "right" });
 *
 * @param {THREE.Object3D} object - the object to rotate (world-space axes)
 * @param {object} [options]
 * @param {string} [options.handedness] - "right" (default), "left", or "any"
 * @param {number} [options.radius] - surface radius in metres for the
 *   glued-surface mapping; defaults to the object's bounding sphere
 * @param {number} [options.gain] - rotation multiplier (default 1: exact)
 * @param {boolean} [options.momentum] - throw on release (default true)
 * @param {number} [options.damping] - momentum decay rate (default 1.6/s)
 * @param {number} [options.pinchStart] - joints pinch threshold, metres
 * @param {number} [options.pinchEnd] - joints release threshold, metres
 */
export default class GrabRotate {
  constructor(object, options = {}) {
    this.experience = new Experience();
    this.hands = this.experience.hands;
    this.object = object;

    this.config = {
      handedness: "right",
      radius: null,
      gain: 1,
      momentum: true,
      damping: 1.6,
      pinchStart: 0.018,
      pinchEnd: 0.032,
      lostTimeout: 0.4,
      ...options,
    };

    this.grabbing = false;
    this.anchor = new THREE.Vector3();
    this.spinVelocity = new THREE.Vector3();
    this._lostFor = 0;
    this._velocitySamples = [];
    this._p = new THREE.Vector3();
    this._tipA = new THREE.Vector3();
    this._tipB = new THREE.Vector3();

    this.hands.interactions.push(this);
  }

  _radius() {
    if (this.config.radius) return this.config.radius;
    const box = new THREE.Box3().setFromObject(this.object);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    this.config.radius = Math.max(sphere.radius, 0.01);
    return this.config.radius;
  }

  _handednesses() {
    return this.config.handedness === "any"
      ? ["right", "left", "none"]
      : [this.config.handedness, "none"];
  }

  /** Current grab point in world space: hand-joint pinch midpoint when
   *  tracked, else the transient-pointer/controller pose while selecting. */
  _samplePoint() {
    for (const handedness of this._handednesses()) {
      const hand = this.hands.hand(handedness);
      if (hand) {
        const gap = this.hands.pinchGap(hand);
        if (gap !== null) {
          hand.joints["index-finger-tip"].getWorldPosition(this._tipA);
          hand.joints["thumb-tip"].getWorldPosition(this._tipB);
          this._p.addVectors(this._tipA, this._tipB).multiplyScalar(0.5);
          return { point: this._p, gap, pointer: false };
        }
      }
      const pointer = this.hands.pointer(handedness);
      if (pointer && pointer.userData.selecting) {
        pointer.getWorldPosition(this._p);
        return { point: this._p, gap: 0, pointer: true };
      }
    }
    return null;
  }

  /** World-space axis/angle applied through the object's parent frame, so it
   *  behaves under any parent transform. */
  _rotateWorldAxis(axis, angle) {
    const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    if (this.object.parent) {
      const parentQuat = this.object.parent.getWorldQuaternion(
        new THREE.Quaternion(),
      );
      q.premultiply(parentQuat.clone().invert()).multiply(parentQuat);
    }
    this.object.quaternion.premultiply(q);
  }

  update(dt) {
    // Momentum applies on every frame, including outside XR.
    const w = this.spinVelocity.length();
    if (w > 0.0005 && !this.grabbing) {
      this._rotateWorldAxis(this.spinVelocity.clone().normalize(), w * dt);
      this.spinVelocity.multiplyScalar(Math.exp(-dt * this.config.damping));
    }

    if (!this.experience.isXRActive()) {
      this.grabbing = false;
      return;
    }

    const sample = this._samplePoint();
    if (!sample) {
      if (this.grabbing) {
        // A vanished transient-pointer IS the release gesture — throw now.
        // Lost hand joints get a grace period instead: visionOS drops them
        // transiently and an instant release would stutter the grab.
        if (this._grabbedViaPointer) {
          this._release();
        } else {
          this._lostFor += dt;
          if (this._lostFor > this.config.lostTimeout) this._release();
        }
      }
      return;
    }
    this._lostFor = 0;

    const wantsGrab = sample.pointer
      ? true
      : sample.gap < this.config.pinchStart;
    const wantsRelease = sample.pointer
      ? false // pointer releases by disappearing from _samplePoint
      : sample.gap > this.config.pinchEnd;

    if (!this.grabbing && wantsGrab) {
      this.grabbing = true;
      this._grabbedViaPointer = sample.pointer;
      this.anchor.copy(sample.point);
      this._velocitySamples.length = 0;
      this.spinVelocity.set(0, 0, 0); // catch a spinning object
      return;
    }
    if (this.grabbing && wantsRelease) {
      this._release();
      return;
    }
    if (!this.grabbing) return;

    const center = this.object.getWorldPosition(new THREE.Vector3());
    const rHat = this.anchor.clone().sub(center);
    const dist = rHat.length();
    if (dist < 1e-4) {
      this.anchor.copy(sample.point);
      return;
    }
    rHat.divideScalar(dist);

    const d = sample.point.clone().sub(this.anchor);
    const dT = d.clone().addScaledVector(rHat, -d.dot(rHat));
    const len = dT.length();
    if (len > 1e-6) {
      const angle = (len / this._radius()) * this.config.gain;
      const axis = new THREE.Vector3().crossVectors(rHat, dT).normalize();
      this._rotateWorldAxis(axis, angle);
      if (dt > 0) {
        this._velocitySamples.push(axis.multiplyScalar(angle / dt));
        if (this._velocitySamples.length > 5) this._velocitySamples.shift();
      }
    }
    this.anchor.copy(sample.point); // re-anchor every frame
  }

  _release() {
    this.grabbing = false;
    this._lostFor = 0;
    if (this.config.momentum && this._velocitySamples.length) {
      const avg = new THREE.Vector3();
      for (const s of this._velocitySamples) avg.add(s);
      avg.divideScalar(this._velocitySamples.length);
      if (avg.length() > 0.15) this.spinVelocity.copy(avg);
    }
    this._velocitySamples.length = 0;
  }
}
