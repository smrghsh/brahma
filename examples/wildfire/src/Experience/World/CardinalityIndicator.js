import * as THREE from "three";
import Experience from "../Experience.js";

export default class CardinalityIndicator extends THREE.Group {
  constructor(radius = 9) {
    super();
    this.radius = radius;
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(this.radius + 0.01, 0.01, 16, 100),
      new THREE.MeshBasicMaterial({
        color: 0x777777,
        transparent: true,
        wireframe: true,
      })
    );
    this.yOffset = 0.1;
    // this.ring.position.y = this.yOffset;
    this.ring.rotation.x = Math.PI / 2;
    const cardinalDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    cardinalDirections.forEach((direction, index) => {
      // place a plane at each cardinal direction, face the origin
      //   const plane = new THREE.Mesh(
      //     new THREE.PlaneGeometry(0.5, 0.5),
      //     new THREE.MeshBasicMaterial({
      //       color: 0x333333,
      //       transparent: true,
      //       wireframe: true,
      //     })
      //   );
      // each plane is a 100x100 canvas that has the cardinal direction text on it. white on black
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 150;
      canvas.height = 150;
      context.fillStyle = "#333333";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.font = "80px Times New Roman";
      context.textAlign = "center";
      context.fillText(direction, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.5),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        })
      );
      // N would be at 0,this.yOffset,-1*radius
      // E would be at radius,this.yOffset,0
      // S would be at 0,this.yOffset,radius
      // W would be at -1*radius,this.yOffset,0
      // use trig to determine the x and z position
      const x = Math.sin((index * Math.PI) / 4) * this.radius;
      const z = -Math.cos((index * Math.PI) / 4) * this.radius;
      plane.position.x = x;
      plane.position.z = z;

      plane.position.y = 0.1;
      // rotate the plane to face the center
      plane.lookAt(0, this.yOffset, 0);
      this.add(plane);
    });
    this.add(this.ring);
    // this.rotation.y += Math.PI;
  }
}
