import * as THREE from "three";
import Experience from "../..//Experience.js";
import TimeScrubberText from "./TimeScrubberText.js";
import RaycastableButton from "../../UI/RaycastableButton.js";
import { update } from "three/examples/jsm/libs/tween.module.js";

export default class TimeScrubber extends THREE.Group {
  constructor(initialTime, finalTime, timePerTick) {
    super();
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.finalTime = finalTime;
    this.timePerTick = timePerTick;
    this.currentTime = initialTime;
    this.initialTime = initialTime;
    this.simulationState = 0; //0 for paused, 1 for playing
    this.rate = 1; //ticks per real world time //simulation speed;
    this.experience = new Experience();
    this.timeScrubberPlayhead = null;
    this.makeTimeScrubberBack();
    this.makeTimeScrubberButtons();
    this.timeScrubberText = new TimeScrubberText();
    this.makeTimeScrubberTimeline();
    this.startVector = new THREE.Vector3(-4.25, 1.5, -5.5);
    this.endVector = new THREE.Vector3(-0.75, 1.5, -5.5);
    this.makeTimeScrubberPoints();
    this.makeTimeScrubberTicks();
    this.makeTimeScrubberPlayhead();
    this.makeRateButtons(); //TO BE KILLED/FIXED LATER
    this.position.y += 1;
    this.scene.add(this);
    /**
     * Debug
     */
    // this.debug = this.experience.debug;

    // this.debugFolder = this.debug.ui.addFolder("TimeScrubber");

    // this.debugFolder
    //   .add(this, "currentTime", this.initialTime, this.finalTime, 1)
    //   .name("currentTime")
    //   .onChange((value) => {
    //     this.updateSimulationTime(value, this.simulationState, this.rate);
    //     this.experience.world.geo.agents.changeTemporalState(value);
    //   });
    // // play /pause
    // // button for play, button for pause
    // this.debugFolder.add(this, "play").name("play");
    // // next, button that goes forward 1
    // this.debugFolder.add(this, "forward").name("forward");
  }

  makeRateButtons() {
    const timeScrubberButtonGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    const timeScrubberButtonMaterial = new THREE.MeshBasicMaterial({
      // map: texture,
      // side: THREE.DoubleSide,
      color: 0xb846f0,
    });

    for (let i = 0; i < 6; i++) {
      const buttonColor = i * 0x111122;
      const timeScrubberRateButton = new RaycastableButton(
        timeScrubberButtonGeometry,
        [
          new THREE.MeshBasicMaterial({ color: "black" }),
          new THREE.MeshBasicMaterial({ color: "black" }),
          new THREE.MeshBasicMaterial({ color: "black" }),
          new THREE.MeshBasicMaterial({ color: "black" }),
          timeScrubberButtonMaterial.clone(),
          new THREE.MeshBasicMaterial({ color: "black" }),
        ],
        "rate",
        buttonColor,
        () => {
          this.setRate(2 ** i);
        }
      );
      timeScrubberRateButton.position.set(-3.75 + i / 2, 0.5, -5.5);
      this.add(timeScrubberRateButton);
    }
  }
  makeTimeScrubberBack() {
    if (this.timeScrubberBack) {
      this.remove(this.timeScrubberBack);
      this.timeScrubberBack.geometry.dispose();
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 475;
    canvas.height = 325;

    context.fillStyle = this.experience.world.canvasBackgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    //Time in Minutes and Seconds string
    let strMin = Math.trunc(this.currentTime / 60);
    if (strMin.length < 2) {
      strMin = "0" + String(strMin);
    }
    let strSec = this.currentTime % 60;
    if (strSec.length < 2) {
      if (strSec < 10) {
        strSec = "0" + String(strSec);
      } else {
        strSec = "0" + String(strSec);
      }
    }
    if ((strSec == "0") | (strSec == 0)) {
      strSec = "00";
    }
    if ((strMin == "0") | (strMin == 0)) {
      strMin = "00";
    }
    let strTime = strMin + ":" + strSec;

    //elapsed time
    context.font = "64px Arial";
    context.fillStyle = this.experience.world.canvasFontColor;
    context.textAlign = "center";
    context.fillText(strTime, canvas.width / 2, canvas.height / 2 + 60);

    //start
    context.font = "20px Arial";
    context.textAlign = "left";
    context.fillText("00:00", 14, canvas.height / 2 + 30);

    //end
    context.font = "20px Arial";
    context.textAlign = "right";
    context.fillText("53:18", canvas.width - 14, canvas.height / 2 + 30);

    const texture = new THREE.CanvasTexture(canvas);

    const timeScrubberBackMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const timeScrubberBackGeometry = new THREE.PlaneGeometry(3.8, 2.6);
    const timeScrubberBack = new THREE.Mesh(
      timeScrubberBackGeometry,
      timeScrubberBackMaterial
    );

    timeScrubberBack.position.set(-2.5, 1.4, -5.5);
    this.add(timeScrubberBack);
  }

  makeTimeScrubberButtons() {
    const timeScrubberButtonGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);

    const texture = this.resources.items.playTexture;
    // material for a box where the image is on all sides
    const timeScrubberPlayButtonMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });

    const timeScrubberPlayButton = new RaycastableButton(
      timeScrubberButtonGeometry,
      [
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        timeScrubberPlayButtonMaterial,
        new THREE.MeshBasicMaterial({ color: "black" }),
      ],
      //timeScrubberButtonMaterial.clone(),
      "play",
      0xffffff,
      () => {
        this.play();
      }
    );
    timeScrubberPlayButton.position.set(-2.5, 2.25, -5.5);
    this.add(timeScrubberPlayButton);

    //BACK BUTTON

    const backButtonTexture = this.resources.items.backwardTexture;
    // material for a box where the image is on all sides
    const timeScrubberBackButtonMaterial = new THREE.MeshBasicMaterial({
      map: backButtonTexture,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });

    const timeScrubberBackButton = new RaycastableButton(
      timeScrubberButtonGeometry,
      [
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        timeScrubberBackButtonMaterial,
        new THREE.MeshBasicMaterial({ color: "black" }),
      ],
      "back",
      0xffffff,
      () => {
        this.back(1 / 2);
      }
    );
    timeScrubberBackButton.position.set(-3.25, 2.25, -5.5);
    this.add(timeScrubberBackButton);

    //FORWARD BUTTON
    const forwardButtonTexture = this.resources.items.forwardTexture;
    // material for a box where the image is on all sides
    const timeScrubberFowardButtonMaterial = new THREE.MeshBasicMaterial({
      map: forwardButtonTexture,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });

    const timeScrubberForwardButton = new RaycastableButton(
      timeScrubberButtonGeometry,
      [
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        timeScrubberFowardButtonMaterial,
        new THREE.MeshBasicMaterial({ color: "black" }),
      ],
      "forward",
      0xffffff,
      () => {
        this.forward(1 / 2);
      }
    );
    timeScrubberForwardButton.position.set(-1.75, 2.25, -5.5);
    this.add(timeScrubberForwardButton);

    //SUPER BACK BUTTON
    const superBackButtonTexture = this.resources.items.superBackTexture;
    // material for a box where the image is on all sides
    const timeScrubberSuperBackButtonMaterial = new THREE.MeshBasicMaterial({
      map: superBackButtonTexture,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });

    const timeScrubberSuperBackButton = new RaycastableButton(
      timeScrubberButtonGeometry,
      [
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        timeScrubberSuperBackButtonMaterial,
        new THREE.MeshBasicMaterial({ color: "black" }),
      ],
      "super-back",
      0xffffff,
      () => {
        this.back(3);
      }
    );
    timeScrubberSuperBackButton.position.set(-4, 2.25, -5.5);
    this.add(timeScrubberSuperBackButton);

    //SUPER FORWARD BUTTON
    const superForwardButtonTexture = this.resources.items.superForwardTexture;
    // material for a box where the image is on all sides
    const timeScrubberSuperFowardButtonMaterial = new THREE.MeshBasicMaterial({
      map: superForwardButtonTexture,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
    });

    const timeScrubberSuperForwardButton = new RaycastableButton(
      timeScrubberButtonGeometry,
      [
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        new THREE.MeshBasicMaterial({ color: "black" }),
        timeScrubberSuperFowardButtonMaterial,
        new THREE.MeshBasicMaterial({ color: "black" }),
      ],
      "superForward",
      0xffffff,
      () => {
        this.forward(3);
      }
    );
    timeScrubberSuperForwardButton.position.set(-1, 2.25, -5.5);
    this.add(timeScrubberSuperForwardButton);
  }
  makeTimeScrubberTimeline() {
    const timeScrubberTimelineGeometry = new THREE.BoxGeometry(
      3.5,
      0.025,
      0.01
    );
    const timeScrubberTimelineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const timeScrubberTimeline = new THREE.Mesh(
      timeScrubberTimelineGeometry,
      timeScrubberTimelineMaterial
    );
    timeScrubberTimeline.position.set(-2.5, 1.5, -5.5);
    this.add(timeScrubberTimeline);
  }
  makeTimeScrubberPoints() {
    //create Endpoints
    const timeScrubberEndpointsGeometry = new THREE.BoxGeometry(
      0.05,
      0.3,
      0.01
    );
    const timeScrubberEndpointsMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    //create start
    const timeScrubberStart = new THREE.Mesh(
      timeScrubberEndpointsGeometry,
      timeScrubberEndpointsMaterial
    );
    timeScrubberStart.position.set(
      this.startVector.x,
      this.startVector.y,
      this.startVector.z
    );
    this.add(timeScrubberStart);
    //create end
    const timeScrubberEnd = new THREE.Mesh(
      timeScrubberEndpointsGeometry,
      timeScrubberEndpointsMaterial
    );
    timeScrubberEnd.position.set(
      this.endVector.x,
      this.endVector.y,
      this.endVector.z
    );
    this.add(timeScrubberEnd);
    //create smallpoints
    const timeScrubberPointGeometry = new THREE.BoxGeometry(0.01, 0.2, 0.01);
    const timeScrubberPointMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const timeScrubberPoints = new THREE.InstancedMesh(
      timeScrubberPointGeometry,
      timeScrubberPointMaterial,
      this.finalTime / this.timePerTick
    );
    const numDiff =
      (this.endVector.getComponent(0) - this.startVector.getComponent(0)) /
      (this.finalTime / this.timePerTick);
    for (let i = 0; i < (this.finalTime / this.timePerTick) * 2; i++) {
      if (i % 2 == 1) {
        timeScrubberPoints.setMatrixAt(
          (i - 1) / 2,
          new THREE.Matrix4().makeTranslation(
            this.startVector.x + (i * numDiff) / 2,
            this.startVector.y,
            this.startVector.z
          )
        );
      }
    }
    this.add(timeScrubberPoints);
  }
  makeTimeScrubberTicks() {
    const timeScrubberTicksGeometry = new THREE.BoxGeometry(0.02, 0.2, 0.01);
    const numDiff =
      (this.endVector.getComponent(0) - this.startVector.getComponent(0)) /
      (this.finalTime / this.timePerTick);
    for (let i = 0; i < this.finalTime / this.timePerTick; i++) {
      const timeScrubberTick = new RaycastableButton(
        timeScrubberTicksGeometry,
        new THREE.MeshBasicMaterial({ color: "white" }),
        "timeSet",
        0xffffff,
        () => {
          this.setSimulationTime(this.initialTime + i * this.timePerTick);
        }
      );
      timeScrubberTick.position.set(
        this.startVector.x + i * numDiff,
        this.startVector.y + 0.01,
        this.startVector.z
      );
      this.add(timeScrubberTick);
    }
  }
  makeTimeScrubberPlayhead() {
    if (this.timeScrubberPlayhead) {
      // console.log("remove");
      this.remove(this.timeScrubberPlayhead);
      this.timeScrubberPlayhead.geometry.dispose();
    }
    const timeScrubberPlayheadGeometry = new THREE.SphereGeometry(0.05, 32, 16);
    const timeScrubberPlayheadMaterial = new THREE.MeshBasicMaterial({
      color: 0xee4b2b,
    });
    const timeScrubberPlayhead = new THREE.Mesh(
      timeScrubberPlayheadGeometry,
      timeScrubberPlayheadMaterial
    );
    this.timeScrubberPlayhead = timeScrubberPlayhead;
    const numDiff =
      (this.endVector.x - this.startVector.x) /
      (this.finalTime / this.timePerTick);
    timeScrubberPlayhead.position.set(
      this.startVector.x + (this.currentTime * numDiff) / this.timePerTick,
      1.5,
      -5.49999995
    );
    this.add(timeScrubberPlayhead);
  }
  play() {
    console.log("play"); //to change later.
    if (!this.experience.networking || true) {
      this.noNetworkPlay();
      return;
    }
    if (this.simulationState == 0) {
      this.experience.networking?.sendSimulationState(1);
      this.simulationState = 1;
    } else {
      this.experience.networking?.sendSimulationState(0);
      this.simulationState = 0;
    }
  }
  noNetworkPlay() {
    if (this.simulationState == 0) {
      this.simulationState = 1;
    } else {
      this.simulationState = 0;
    }
    if (this.simulationState == 1) {
      let interval = setInterval(() => {
        this.forward(this.rate / this.timePerTick);
        if (this.currentTime == this.finalTime || this.simulationState == 0) {
          clearInterval(interval);
        }
      }, 100);
    }
  }
  back(multiplier) {
    console.log("back");
    this.setSimulationTime(this.currentTime - this.timePerTick * multiplier);
  }
  forward(multiplier = 1) {
    console.log("forward");
    this.setSimulationTime(this.currentTime + this.timePerTick * multiplier);
    this.makeTimeScrubberPlayhead();
  }
  getSimulationTime() {
    return this.currentTime;
  }
  setSimulationTime(value) {
    if (value >= this.initialTime && value <= this.finalTime) {
      this.experience.networking?.sendSimulationTime(value);
      this.currentTime = value;
      this.updateSimulationTime(value, this.simulationState, this.rate);
      console.log("set time to " + value);
    } else if (value < this.initialTime) {
      this.experience.networking?.sendSimulationTime(this.initialTime);
      this.currentTime = this.initialTime;
      this.updateSimulationTime(
        this.initialTime,
        this.simulationState,
        this.rate
      );
    } else if (value > this.finalTime) {
      this.experience.networking?.sendSimulationTime(this.finalTime);
      this.currentTime = this.finalTime;
      this.updateSimulationTime(
        this.finalTime,
        this.simulationState,
        this.rate
      );
    }
  }
  setRate(newRate) {
    this.rate = newRate;
    //this.experience.networking?.sendSimulationRate(newRate);
  }
  updateSimulationTime(time, state, rate) {
    //change this from currentTime to the time from the server
    this.currentTime = time;
    this.experience.world.geo.agents.changeTemporalState(time);
    this.simulationState = state;
    this.rate = rate;
    // console.log("update time to " + this.currentTime);
    if (this.currentTime > this.finalTime) {
      this.currentTime = this.initialTime;
    }
    this.makeTimeScrubberPlayhead();
    this.makeTimeScrubberBack();
  }
}
//
