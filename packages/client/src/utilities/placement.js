import * as THREE from "three";

/**
 * Place an object relative to the viewer's actual head pose — the reliable
 * way to put a hand-held visualization "in front of you" in XR, where floor
 * origins differ per device and per seating position.
 *
 * Call after the session has produced real poses (the first frames can be
 * identity). Returns false until a valid pose arrives, so it is safe to call
 * once per frame until it succeeds:
 *
 *   // in your World/app update, after entering XR:
 *   if (!this.placed) this.placed = placeInFrontOfHead(this.globe);
 *
 * @param {THREE.Object3D} object - object to move (world coordinates)
 * @param {object} [options]
 * @param {number} [options.distance] - metres along the horizontal forward (default 0.55)
 * @param {number} [options.below] - metres below eye level (default 0.06)
 * @param {Experience} [options.experience] - defaults to window.experience
 * @returns {boolean} whether a valid head pose was available
 */
export function placeInFrontOfHead(object, options = {}) {
  const experience = options.experience ?? window.experience;
  const distance = options.distance ?? 0.55;
  const below = options.below ?? 0.06;

  const xr = experience.renderer.instance.xr;
  if (!xr.isPresenting) return false;
  const cam = xr.getCamera();
  const headPos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  if (headPos.lengthSq() < 1e-6) return false;

  const e = cam.matrixWorld.elements;
  const forward = new THREE.Vector3(-e[8], -e[9], -e[10]).setY(0);
  if (forward.lengthSq() < 1e-4) return false;
  forward.normalize();

  object.position
    .copy(headPos)
    .addScaledVector(forward, distance)
    .add(new THREE.Vector3(0, -below, 0));
  return true;
}
