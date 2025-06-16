import * as THREE from "three";
import Experience from "../../Experience.js";
import Agent from "./Agent.js";
import { ConeGeometry } from "three";
import TimeScrubber from "../TimeScrubber/TimeScrubber.js";
export default class Agents extends THREE.Group {
  constructor() {
    // this is a THREE.Group that we're going to add all the agents to
    super();
    this.experience = new Experience();
    this.world = this.experience.world;
    this.projection = this.experience.world.geo.projection;
    this.debug = this.experience.debug;
    this.scene = this.experience.scene;
    this.geometry = new ConeGeometry(0.85, 1.8, 32);
    this.geometry.scale(0.05, 0.05, 0.05);
    this.scaling = this.experience.world.geo.scaling;
    this.defaultColor = 0xffdf00;
    this.hoveredColor = 0xf5ad64;
    this.agents = new Map();
    this.timeScrubber = null;

    this.addAgents();
    // this.debugFolder = this.debug.ui.addFolder("Agents");
  }
  async addAgents() {
    try {
      const response = await fetch("StartingAgents.json", {
        headers: {
          Accept: "application/json",
        },
      });
      const startingAgentsData = await response.json();
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("The response is not JSON");
      }

      startingAgentsData.data.forEach((agent) => {
        const id = agent.agent_id;
        const lat = agent.lat;
        const lng = agent.lng;

        // Check if an agent with the same lat/lng already exists
        if (this.agents.has(id)) {
          return; // Skip creating a new agent
        }

        // Add the current agent's lat/lng to the set

        const [x, z] = this.projection.proj([lat, lng]);
        // new material
        const material = new THREE.MeshToonMaterial({
          color: this.defaultColor,
          // wireframe: true,
        });
        const calloutableAgent = new Agent(
          this.geometry,
          material,
          id,
          this.defaultColor,
          this.hoveredColor
        );
        calloutableAgent.position.set(
          x * this.scaling.x,
          0.4,
          -z * this.scaling.z
        );
        calloutableAgent.rotation.x = Math.PI;
        this.agents.set(id, calloutableAgent);
        this.scene.add(this.agents.get(id));
      });
    } catch (error) {
      console.error("Error adding agents", error);
    }

    try {
      const response = await fetch("shrunkMinStatesMin.json", {
        headers: {
          Accept: "application/json",
        },
      });
      this.agentStatesData = await response.json();
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("The response is not JSON");
      }
      // console.log("agentStatesData", this.agentStatesData);
      // there are 3665 empty objects, and therefore 3665 empty frames
      // reslice the array to remove the empty objects
      this.agentStatesData = this.agentStatesData.slice(3665);
      // console.log("agentStatesData", this.agentStatesData);
    } catch (error) {
      console.error("Error fetching agentStatesData", error);
    }
    // console.log("length", this.agentStatesData.length);
    this.world.timeScrubber = new TimeScrubber(
      0,
      this.agentStatesData.length,
      150
    ); // Sample values, 0 second start, 300 second end, 20 seconds per point
    this.timeScrubber = this.world.timeScrubber;
  }
  changeTemporalState(time) {
    // get the agentStatesData at the current time
    const agentStates = this.agentStatesData[time];
    // console.log("agentStates", agentStates);
    // if agentStates is undefined or empty, return
    if (!agentStates || Object.keys(agentStates).length === 0) {
      return;
    }
    // make all agents invisible
    this.agents.forEach((agent) => {
      agent.visible = false;
    });
    // agentStates is an object with agent id as the key and an array of 3 where the first is link, second is lat, third is long
    Object.keys(agentStates).forEach((agentId) => {
      const agent = this.agents.get(agentId);
      agent.visible = true;
      const [x, z] = this.projection.proj([
        agentStates[agentId][1],
        agentStates[agentId][2],
      ]);
      agent.position.set(x * this.scaling.x, 0.4, -z * this.scaling.z);
    });
  }
}
