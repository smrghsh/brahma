import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import EventEmitter from "./EventEmitter.js";

/**
 * Manifest-driven asset preloader. Pass an array of sources
 * { name, type, path } with type one of: gltfModel, glbModel, texture,
 * cubeTexture, font, exr, simulationData (raw text fetch).
 *
 * Emits "progress" (loaded, toLoad) per asset and "ready" when done.
 */
export default class Resources extends EventEmitter {
  constructor(sources = []) {
    super();
    this.sources = sources;
    // Setup
    this.items = {};
    this.toLoad = this.sources.length;
    this.loaded = 0;
    this.setLoaders();

    if (this.toLoad === 0) {
      // Nothing to load — announce readiness asynchronously so listeners
      // attached right after construction still hear it
      setTimeout(() => this.trigger("ready"));
    } else {
      this.startLoading();
    }
  }

  setLoaders() {
    this.loaders = {};
    this.loaders.glbLoader = new GLTFLoader();
    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.textureLoader = new THREE.TextureLoader();
    this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.loaders.fontLoader = new FontLoader();
    this.loaders.exrLoader = new EXRLoader();
  }

  startLoading() {
    // Load each source
    for (const source of this.sources) {
      if (source.type === "gltfModel") {
        this.loaders.gltfLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "glbModel") {
        this.loaders.glbLoader.load(source.path, (glb) => {
          this.sourceLoaded(source, glb);
        });
      } else if (source.type === "texture") {
        this.loaders.textureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "cubeTexture") {
        this.loaders.cubeTextureLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "font") {
        this.loaders.fontLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "exr") {
        this.loaders.exrLoader.load(source.path, (file) => {
          this.sourceLoaded(source, file);
        });
      } else if (source.type === "simulationData") {
        fetch(source.path)
          .then((response) => {
            return response.text();
          })
          .then((data) => {
            this.sourceLoaded(source, data);
          });
      } else {
        console.warn(`brahma: unknown source type "${source.type}"`, source);
      }
    }
  }

  sourceLoaded(source, file) {
    this.items[source.name] = file;

    this.loaded++;
    this.trigger("progress", [this.loaded, this.toLoad]);

    if (this.loaded === this.toLoad) {
      this.trigger("ready");
    }
  }
}
