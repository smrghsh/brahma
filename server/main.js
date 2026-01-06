const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const os = require("os");
const path = require("path");

const app = express();
app.use(cors());
//Note: Data in the packet is all lowercase, whereas the data extracted is camelcased
const interlocutors = {};

// Shared callout state
const sharedCallout = {
  visible: false,
  position: null,
  sealPath: null,
  pointIndex: null,
  triggeredBy: null,
  lastUpdated: null,
};

// CSV logging setup
const logDate = new Date()
  .toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })
  .replace(/\//g, "-");
const logFilePath = `./interlocutor_tracking_${logDate}.csv`;
let csvStream;

// Initialize CSV file with headers
function initializeCSV() {
  const headers =
    "timestamp,name,color,HMD_m0,HMD_m1,HMD_m2,HMD_m3,HMD_m4,HMD_m5,HMD_m6,HMD_m7,HMD_m8,HMD_m9,HMD_m10,HMD_m11,HMD_m12,HMD_m13,HMD_m14,HMD_m15," +
    "LC_m0,LC_m1,LC_m2,LC_m3,LC_m4,LC_m5,LC_m6,LC_m7,LC_m8,LC_m9,LC_m10,LC_m11,LC_m12,LC_m13,LC_m14,LC_m15," +
    "RC_m0,RC_m1,RC_m2,RC_m3,RC_m4,RC_m5,RC_m6,RC_m7,RC_m8,RC_m9,RC_m10,RC_m11,RC_m12,RC_m13,RC_m14,RC_m15\n";

  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, headers);
    console.log(`📝 CSV log file created: ${logFilePath}`);
  } else {
    console.log(`📝 Appending to existing CSV log: ${logFilePath}`);
  }

  csvStream = fs.createWriteStream(logFilePath, { flags: "a" });
}

// Log interlocutor data to CSV
function logInterlocutorsToCSV() {
  const timestamp = new Date().toISOString();

  Object.values(interlocutors).forEach((interlocutor) => {
    if (
      interlocutor.HMDPosition &&
      interlocutor.LController &&
      interlocutor.RController
    ) {
      const row = [
        timestamp,
        interlocutor.name,
        interlocutor.color,
        ...interlocutor.HMDPosition,
        ...interlocutor.LController,
        ...interlocutor.RController,
      ].join(",");

      csvStream.write(row + "\n");
    }
  });
}

// Helper function to generate random alphanumeric usernames
function generateUsername() {
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

// Helper function to generate a random pastel hex color
// Helper function to generate a random pastel color in 0x000000 format
function generatePastelColor() {
  const randomHex = () => Math.floor(Math.random() * 128 + 127); // Pastel color component
  const red = randomHex().toString(16).padStart(2, "0");
  const green = randomHex().toString(16).padStart(2, "0");
  const blue = randomHex().toString(16).padStart(2, "0");

  return `0x${red}${green}${blue}`;
}

// API route to get unique username and color
app.get("/uniqueUsernameAndColor", (req, res) => {
  const username = generateUsername();
  const color = generatePastelColor();
  res.json({ username, color });
});

// API route to get active interlocutors
app.get("/activeInterlocutors", (req, res) => {
  res.json(interlocutors);
});

// Load SSL/TLS certificate and private key
const serverConfig = {
  cert: fs.readFileSync("/etc/letsencrypt/live/brahma.xrss.org/fullchain.pem"),
  key: fs.readFileSync("/etc/letsencrypt/live/brahma.xrss.org/privkey.pem"),
};

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

// Create HTTPS server
const server = https.createServer(serverConfig, app);
const wss = new WebSocket.Server({ server });

function broadcast() {
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

function broadcastCallout(excludeUser) {
  const packet = JSON.stringify({
    type: "callout",
    ...sharedCallout,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const clientUser = Object.values(interlocutors).find(
        (i) => i.ws === client
      );
      if (clientUser && clientUser.name !== excludeUser) {
        client.send(packet);
      }
    }
  });
}

wss.on("connection", function connection(ws) {
  console.log("Secure client connected");
  ws.on("message", function incoming(message) {
    // console.log("Received: %s", message);
    try {
      const data = JSON.parse(message);

      // Handle callout updates
      if (data.type === "calloutUpdate") {
        sharedCallout.visible = data.visible;
        sharedCallout.position = data.position;
        sharedCallout.sealPath = data.sealPath;
        sharedCallout.pointIndex = data.pointIndex;
        sharedCallout.triggeredBy = data.name;
        sharedCallout.lastUpdated = Date.now();

        console.log(`📍 Callout updated by ${data.name}`);
        broadcastCallout(data.name);
        return;
      }

      if (data.name && data.color) {
        // this means with high confidence that the interlocutor is attempting to send name, color, and avatar embodiment data

        if (!interlocutors[data.name]) {
          // interlocutor introducing itself, as it doesn't exist yet in the interlocutors object
          interlocutors[data.name] = {
            name: data.name,
            color: data.color,
            ws: ws,
          };
          interlocutors[data.name].timeJoined = Date.now();
          console.log(
            `New interlocutor created: ${data.name}, color: ${data.color}`
          );
        } else {
          // Update WebSocket reference in case of reconnection
          interlocutors[data.name].ws = ws;
        }

        if (data.HMDPosition && data.LController && data.RController) {
          // these three are what's used for avatar embodiment
          interlocutors[data.name].HMDPosition = data.HMDPosition;
          interlocutors[data.name].LController = data.LController;
          interlocutors[data.name].RController = data.RController;
          interlocutors[data.name].lastUpdated = Date.now();
        }
      } else {
        console.log("Invalid message: missing name or color");
      }
    } catch (error) {
      console.error("Error processing message from client:", error);
      ws.send("Error: Invalid message format");
    }
  });

  ws.on("close", () => {
    // Find and remove the disconnected user
    for (const [name, interlocutor] of Object.entries(interlocutors)) {
      if (interlocutor.ws === ws) {
        const sessionDuration = (
          (Date.now() - interlocutor.timeJoined) /
          1000
        ).toFixed(1);
        console.log(
          `🔌 Client disconnected: ${name} (session duration: ${sessionDuration}s)`
        );
        delete interlocutors[name];
        console.log(`📊 Active users: ${Object.keys(interlocutors).length}`);
        break;
      }
    }
  });
});

// Initialize CSV logging
initializeCSV();

// Start the HTTPS server on port 8080
server.listen(8080, () => {
  console.log("🛜 WebSocket server started on wss://localhost:8080");
});

setInterval(broadcast, 1000 / 30); // Broadcast 30 times a second
setInterval(logInterlocutorsToCSV, 250); // Log every 0.25 seconds
