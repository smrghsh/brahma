import * as THREE from "three";

/**
 * A floating marker with a text label — used both for your own selected
 * point and for callouts other users share over the relay.
 */
export default class Callout extends THREE.Group {
  constructor(color = 0xffffff) {
    super();

    this.marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.05),
      new THREE.MeshBasicMaterial({ color, wireframe: true }),
    );
    this.add(this.marker);

    this.canvas = document.createElement("canvas");
    this.canvas.width = 512;
    this.canvas.height = 128;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texture,
        transparent: true,
        depthTest: false,
      }),
    );
    this.sprite.scale.set(0.8, 0.2, 1);
    this.sprite.position.y = 0.16;
    this.add(this.sprite);

    this.visible = false;
  }

  show(position, text) {
    this.position.copy(position);
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = "600 44px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    const width = ctx.measureText(text).width + 40;
    ctx.fillRect(256 - width / 2, 20, width, 76);
    ctx.fillStyle = "white";
    ctx.fillText(text, 256, 74);
    this.texture.needsUpdate = true;
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  update(delta) {
    this.marker.rotation.y += delta * 1.5;
  }
}
