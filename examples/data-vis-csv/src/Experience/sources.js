// Declare your assets here — they preload before "ready" fires, then live
// in experience.resources.items keyed by name. Put the files in static/.
//
// simulationData fetches raw text — parse it however your data demands.
export default [
  {
    name: "diveTracks",
    type: "simulationData",
    path: "./data/dive-tracks.csv",
  },
];
