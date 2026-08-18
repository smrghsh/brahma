import "./style.css";
import Experience from "./Experience/Experience.js";

const experience = new Experience(document.querySelector("canvas.webgl"));

// Loading overlay — hides once every source in sources.js has loaded
const loading = document.getElementById("loading");
experience.resources.on("ready", () => {
  loading.style.display = "none";
});

// Join the shared session
const joinButton = document.getElementById("join");
joinButton.addEventListener("click", () => {
  experience.join();
  joinButton.style.display = "none";
});

// Vite HMR: tear down cleanly so hot reloads don't leak render loops
// or leave ghost users in the room
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    experience.destroy();
  });
}
