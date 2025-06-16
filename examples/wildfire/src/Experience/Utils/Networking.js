import * as THREE from "three";
import Experience from "../Experience.js";
import Interlocutors from "../World/Interlocutors.js";

export default class Networking {
  constructor() {
    this.experience = new Experience();
    this.user = this.experience.user;
    this.canSendEmbodiment = false;
    this.interlocutors = new Interlocutors();
    this.callouts = {};

    // First, fetch username and color from the server
    this.initializeUser()
      .then(({ username, color }) => {
        this.user.parameters.userName = username;
        this.user.parameters.color = color;

        console.log(`Received username: ${username}, color: ${color}`);

        // Now create the WebSocket connection
        this.socket = new WebSocket("wss://brahma.xrss.org:8080");

        this.socket.onopen = () => {
          console.log("WebSocket connection established");
          this.sendInitialData(); // Send initial data when the connection opens
          // Enable embodiment sending after 1 second
          setTimeout(() => {
            this.canSendEmbodiment = true;
          }, 2000);
        };

        this.socket.onmessage = (event) => {
          if (event.data.length > 1) {
            let data = JSON.parse(event.data);
            this.receiveEmbodiments(data["interlocutors"]);
            this.receiveCallouts(data["callouts"]);
          }
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          console.log("ReadyState:", this.socket.readyState);
        };

        this.socket.onclose = (event) => {
          console.log("WebSocket connection closed:", event.reason);
        };
      })
      .catch((error) => {
        console.error("Error initializing user:", error);
      });
  }

  // Method to fetch username and color from the server
  async initializeUser() {
    try {
      const response = await fetch(
        "https://brahma.xrss.org:8080/uniqueUsernameAndColor"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch username and color");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  // async contributeCallout(calloutID) {
  //   if (!this.user.parameters.userName) {
  //     console.error("No username found");
  //     return;
  //   }
  //   if (!calloutID) {
  //     console.error("No callout ID found");
  //     return;
  //   }
  //   // callout endpoint looks kinda like this on backend
  //   console.log("Contribute callout:", calloutID);
  //   try {
  //     const response = await fetch("https://brahma.xrss.org:8080/callout", {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         name: this.user.parameters.userName,
  //         calloutID: calloutID,
  //       }),
  //     });
  //     if (!response.ok) {
  //       throw new Error("Failed to contribute callout");
  //     }
  //     const data = await response.json();
  //     console.log(data);
  //     return data;
  //   } catch (error) {
  //     console.error("Error contributing callout:", error);
  //     throw error;
  //   }
  // }

  //attempting race
  async contributeCallout(calloutID) {
    if (!this.user.parameters.userName) {
      console.error("No username found");
      return;
    }
    if (!calloutID) {
      console.error("No callout ID found");
      return;
    }

    console.log("Contribute callout:", calloutID);

    const MAX_RETRIES = 3;
    const TIMEOUT = 2000;

    const fetchWithTimeout = async (url, options) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), TIMEOUT)
        ),
      ]);
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetchWithTimeout(
          "https://brahma.xrss.org:8080/callout",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: this.user.parameters.userName,
              calloutID: calloutID,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to contribute callout (status: ${response.status})`
          );
        }

        const data = await response.json();
        console.log(data);
        return data;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);

        if (attempt === MAX_RETRIES) {
          console.error("All attempts to contribute callout failed.");
          throw error;
        }

        console.log("Retrying...");
      }
    }
  }
  async rescindCallout(calloutID) {
    if (!this.user.parameters.userName) {
      console.error("No username found");
      return;
    }
    if (!calloutID) {
      console.error("No callout ID found");
      return;
    }

    console.log("Rescind callout:", calloutID);
    try {
      const response = await fetch("https://brahma.xrss.org:8080/callout", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: this.user.parameters.userName,
          calloutID: calloutID,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to rescind callout");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error rescinding callout:", error);
      throw error;
    }
  }
  async receiveCallouts(data) {
    // if data is different than this.callouts, update this.callouts
    if (JSON.stringify(data) !== JSON.stringify(this.callouts)) {
      this.callouts = data;
      console.log("Callouts updated:", this.callouts);
    }
  }
  // async receiveCallouts() {
  //   //abandoning, will work with websockets instead
  //   try {
  //     const response = await fetch("https://brahma.xrss.org:8080/callout");
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch callouts");
  //     }

  //     const data = await response.json();
  //     console.log("Received callouts:", data);
  //     return data;
  //   } catch (error) {
  //     console.error("Error fetching callouts:", error);
  //     throw error;
  //   }
  // }

  //these will update the time on the server
  sendSimulationTime(time) {
    const data = {
      simulationtime: time,
    };
    this.socket.send(JSON.stringify(data));
    console.log("Time command sent:", data);
  }

  sendSimulationState(state) {
    const data = {
      simulationplaying: state,
    };
    this.socket.send(JSON.stringify(data));
    console.log("Time State:", data);
  }

  sendSimulationRate(rate) {
    const data = {
      simulationrate: rate,
    };
    this.socket.send(JSON.stringify(data));
    console.log("Time Rate:", data);
  }

  sendInitialData() {
    const initData = {
      name: this.user.parameters.userName,
      color: this.user.parameters.color,
    };

    // Send the initial user data as a string over WebSocket
    this.socket.send(JSON.stringify(initData));
    console.log("Initial user data sent:", initData);
  }

  sendEmbodiment(HMD, LController, RController) {
    // console.log("sending ", HMD.toArray());
    const data = {
      name: this.user.parameters.userName,
      color: this.user.parameters.color,
      HMDPosition: HMD.toArray(),
      LController: LController.toArray(),
      RController: RController.toArray(),
    };

    // Send the data as a string over WebSocket
    if (this.canSendEmbodiment) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.log("Cannot send embodiment data yet");
    }
  }
  //put in the timedata from the server
  receiveEmbodiments(data) {
    // console.log("Raw data received from server:", data);
    try {
      const interlocutorsData = data;
      // console.log("Parsed interlocutor data:", interlocutorsData);

      interlocutorsData.forEach((interlocutor) => {
        try {
          // console.log(`Processing interlocutor: ${interlocutor.name}`);
          if (interlocutor.name === this.user.parameters.userName) {
            return;
          }

          if (!this.interlocutors.containsEmbodiment(interlocutor.name)) {
            console.log(
              `Instantiating new embodiment for ${interlocutor.name}`
            );
            this.interlocutors.instantiateEmbodiment(
              interlocutor.name,
              new THREE.Color(parseInt(interlocutor?.color, 16))
            );
          }

          if (this.interlocutors.containsEmbodiment(interlocutor.name)) {
            if (
              interlocutor.HMDPosition &&
              interlocutor.LController &&
              interlocutor.RController
            ) {
              // console.log(`Updating positions for ${interlocutor.name}`);
              const HMDMatrix = new THREE.Matrix4().fromArray(
                interlocutor.HMDPosition
              );
              const LControllerMatrix = new THREE.Matrix4().fromArray(
                interlocutor.LController
              );
              const RControllerMatrix = new THREE.Matrix4().fromArray(
                interlocutor.RController
              );

              this.interlocutors.updateEmbodiment(
                interlocutor.name,
                HMDMatrix,
                LControllerMatrix,
                RControllerMatrix
              );
            } else {
              console.warn(`Incomplete data for ${interlocutor.name}:`, {
                HMDPosition: interlocutor.HMDPosition,
                LController: interlocutor.LController,
                RController: interlocutor.RController,
              });
            }
          }
        } catch (error) {
          console.error(
            `Error processing interlocutor ${interlocutor.name}:`,
            error
          );
        }
      });
    } catch (error) {
      console.error("Error parsing interlocutor data:", error);
    }
  }
}
