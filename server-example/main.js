// import BrahmaServer from wherever
import { BrahmaServer } from '../src/server.js';

// Start the server
const brahmaServer = new BrahmaServer({ port: 8080 });
brahmaServer.initialize();
brahmaServer.run();
// at the very least (your first goal is to make the import work and comment out any lines from Brahma to make two logs come out of this file)
