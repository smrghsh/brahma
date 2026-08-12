import Experience from "../Experience.js";

/**
 * XR hand-tracking plumbing — the missing input tier between "controllers"
 * and "nothing". Wires up `renderer.xr.getHand(0|1)` alongside the existing
 * controllers, resolves handedness from `connected` events (indices 0/1 are
 * never assumed to be left/right), and exposes pinch state read from raw
 * joints so interactions can implement their own hysteresis.
 *
 * Also covers the Apple Vision Pro *transient-pointer* path: when a page has
 * not been granted hand-tracking (or the user simply system-pinches), Safari
 * delivers a transient input source that fires selectstart/selectend with a
 * targetRaySpace pose but no joints. `pointer(handedness)` exposes it, so
 * interactions built on Hands work on visionOS out of the box either way.
 *
 * No hand models are rendered by default: on passthrough devices your real
 * hands are the model.
 *
 * Interactions (e.g. GrabRotate) register themselves via
 * `experience.hands.interactions.push(this)` and receive `update(dt)` every
 * frame of the render loop — including inside immersive sessions, where the
 * rAF-driven Time utility does not tick.
 */
export default class Hands {
  constructor() {
    this.experience = new Experience();
    const xr = this.experience.renderer.instance.xr;

    /** Interactions ticked from the render loop: objects with update(dt). */
    this.interactions = [];
    this._lastTime = null;

    this.hands = [0, 1].map((i) => {
      const hand = xr.getHand(i);
      hand.userData.handedness = null;
      hand.addEventListener("connected", (e) => {
        hand.userData.handedness = e.data?.handedness ?? null;
      });
      hand.addEventListener("disconnected", () => {
        hand.userData.handedness = null;
      });
      this.experience.cameraGroup.add(hand);
      return hand;
    });

    // The same controller objects three uses for transient-pointer input.
    // getController() returns stable objects, so this does not conflict with
    // Controller.js — we only add listeners.
    this.pointers = [0, 1].map((i) => {
      const c = xr.getController(i);
      c.userData.handedness ??= null;
      c.userData.selecting ??= false;
      c.addEventListener("connected", (e) => {
        c.userData.handedness = e.data?.handedness ?? null;
        c.userData.isTransientPointer =
          e.data?.targetRayMode === "transient-pointer";
      });
      c.addEventListener("disconnected", () => {
        c.userData.handedness = null;
        c.userData.selecting = false;
      });
      c.addEventListener("selectstart", () => (c.userData.selecting = true));
      c.addEventListener("selectend", () => (c.userData.selecting = false));
      return c;
    });
  }

  /** The XRHand group for "left"/"right", or null while untracked. */
  hand(handedness) {
    return this.hands.find((h) => h.userData.handedness === handedness) ?? null;
  }

  /**
   * The controller/transient-pointer for "left"/"right" (visionOS reports
   * the pinching hand; pass "none" for handedness-less sources).
   */
  pointer(handedness) {
    return (
      this.pointers.find((c) => c.userData.handedness === handedness) ?? null
    );
  }

  /**
   * Thumb-tip to index-tip distance in metres, or null while joints are
   * unavailable. Callers implement hysteresis (pinch at < 0.018, release at
   * > 0.032 works well on Vision Pro) and a joint-loss grace period —
   * visionOS drops joints transiently.
   */
  pinchGap(hand) {
    const a = hand?.joints?.["index-finger-tip"];
    const b = hand?.joints?.["thumb-tip"];
    if (!a || !b) return null;
    return a.position.distanceTo(b.position);
  }

  /** Called from the Experience render loop. Computes its own dt so it
   *  keeps ticking inside immersive sessions. */
  update() {
    const now = performance.now();
    const dt =
      this._lastTime === null
        ? 0.016
        : Math.min((now - this._lastTime) / 1000, 0.1);
    this._lastTime = now;
    for (const interaction of this.interactions) {
      interaction.update(dt);
    }
  }
}
