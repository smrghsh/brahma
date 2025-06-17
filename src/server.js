const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

export class BrahmaServer {
  constructor() {
    console.log("Initializing BrahmaServer...");
    // this does any initialization code
    // TODO: make sure any variables and constants are defined here using the this keyword
    this.app = express();
    this.interlocutors = {};
    this.simulationTime = 0;
    this.simulationPlaying = false; //false for paused, true for playing
    this.simulationRate = 1;

        // Create HTTPS server
    this.server = https.createServer(this.serverConfig, this.app);
    this.wss = new WebSocket.Server({ this.server });

        this.app.use(cors());

    // API route to get unique username and color
    this.app.get("/uniqueUsernameAndColor", (req, res) => {
      const username = _generateUsername();
      const color = _generatePastelColor();
      res.json({ username, color });
    });

    // API route to get active interlocutors
    this.app.get("/activeInterlocutors", (req, res) => {
      res.json(interlocutors);
    });

        // const serverConfig = {
    //   cert: fs.readFileSync(
    //     ""
    //   ),
    //   key: fs.readFileSync("/etc/letsencrypt/live/brahma.xrss.org/privkey.pem"),
    // };
    // Load SSL/TLS certificate and private key

    /**
     * The formalized protocol
     *
     * From one user, sent to client
     * embodiment (bad name)
     * name: String
     * color: String
     * HMDPosition: Mat4
     * LController: Mat4 // HMD position if desktop
     * RController: Mat4 // HMD position if desktop
     */



    this.wss.on("connection", function connection(ws) {
      console.log("Secure client connected");
      ws.on("message", function incoming(message) {
        // console.log("Received: %s", message);
        try {
          const data = JSON.parse(message);

          if (data.name && data.color) {
            // this means with high confidence that the interlocutor is attempting to send name, color, and avatar embodiment data

            if (!interlocutors[data.name]) {
              // interlocutor introducing itself, as it doesn't exist yet in the interlocutors object
              interlocutors[data.name] = { name: data.name, color: data.color };
              interlocutors[data.name].timeJoined = Date.now();
              console.log(
                `New interlocutor created: ${data.name}, color: ${data.color}`
              );
            }

            if (data.HMDPosition && data.LController && data.RController) {
              // these three are what's used for avatar embodiment
              interlocutors[data.name].HMDPosition = data.HMDPosition;
              interlocutors[data.name].LController = data.LController;
              interlocutors[data.name].RController = data.RController;
              interlocutors[data.name].lastUpdated = Date.now();
              // i used to have code to clear inactive interlocutors
            }
            //&& data.simulationRate
          } else if (
            Object.hasOwn(data, "type") &&
            data.type == "timeCommand"
          ) {
            // here, or in a similar manner, you would handle other types of messages from the client
            // the client should also be able to update the timescrubber, callouts etc.
            simulationTime = data.simulationtime;
            simulationRate = data.simulationrate;
            simulationPlaying = data.simulationplaying;
            console.log(
              "Received time command: " +
                data.simulationtime +
                " " +
                data.simulationrate +
                " " +
                data.simulationplaying
            );
          } else {
            console.log("Invalid message: missing name or color");
          }
        } catch (error) {
          console.error("Error processing message from client:", error);
          ws.send("Error: Invalid message format");
        }
      });



      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });


    console.log("BrahmaServer (backend) initialized");
  }
  _generateUsername() {
    const alphanumeric = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let username;
    do {
      username = "User-";
      for (let i = 0; i < 2; i++) {
        username += alphanumeric.charAt(
          Math.floor(Math.random() * alphanumeric.length)
        );
      }
    } while (Object.keys(interlocutors).includes(username)); // Ensure unique username
    return username;
  }
  _generatePastelColor() {
    const randomHex = () => Math.floor(Math.random() * 128 + 127); // Pastel color component
    const red = randomHex().toString(16).padStart(2, "0");
    const green = randomHex().toString(16).padStart(2, "0");
    const blue = randomHex().toString(16).padStart(2, "0");

    return `0x${red}${green}${blue}`;
  }


  _broadcast() {
    // for each interlocutor, if the lastUpdated is more than 5 minutes ago, delete them
    // const now = Date.now();
    // Object.keys(interlocutors).forEach((name) => {
    //   if (now - interlocutors[name].lastUpdated > 300000) {
    //     delete interlocutors[name];
    //   }
    // });
    let packet = Object.values(interlocutors).map(
      ({ name, color, HMDPosition, LController, RController }) => ({
        name,
        color,
        HMDPosition,
        LController,
        RController,
      })
    );

    packet = JSON.stringify(packet);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(packet);
      }
    });
  }
  //This function takes care of sending any non-interlocutor data to the clients
  _broadcastTime() {
    let type = "timePacket";
    let timePacket = {
      type: type,
      simulationTime: simulationTime,
      simulationPlaying: simulationPlaying,
      simulationRate: simulationRate,
    };

    timePacket = JSON.stringify(timePacket);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(timePacket);
      }
    });
  }

  run() {

    console.log("BrahmaServer is running...");

    // Start the HTTPS server on port 8080
    this.server.listen(8080, () => {
      console.log("🛜 WebSocket server started on wss://localhost:8080");
    });
  }
}
