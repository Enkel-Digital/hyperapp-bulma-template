#!/usr/bin/env node

// Wrapper function around esbuild, use function parameter to override default options
// Pass in nothing for production build
const build = (options = {}) =>
  require("esbuild").build({
    entryPoints: ["src/main.js"],
    outfile: "dist/main.js",

    // Default options for building for production
    bundle: true,
    minify: true,
    sourcemap: true,
    watch: false,
    metafile: true,

    // Override default options if needed
    ...options,
  });

// Wrapper function aroud build method for development use
// In watch mode, build without minifying, and since not minified no need for sourcemap
const watchMode = () =>
  build({ watch: true, minify: false, sourcemap: false, metafile: false });

const { rm, mkdir, copyFile, watch, writeFile } = require("fs/promises");

const copyHTML = async () => copyFile("./src/index.html", "./dist/index.html");

// Watch HTML copies over the HTML at least once before watching for changes
// const watchHTML = async () => {
//   for await (const _ of watch("./src/index.html")) copyHTML();
// };

// Start a dev server using live-server with some default configs
const startDevServer = () =>
  require("live-server").start({
    host: "localhost", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    // port: 8181, // Set the server port. Defaults to 8080.

    root: "./dist", // Set root directory that's being served. Defaults to cwd.
    file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)

    wait: 10, // Waits for all changes, before reloading. Defaults to 0 sec.
    logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
    open: false, // When false, it won't load your browser by default.

    // watch: "/dist",// Watches everything by default
    // ignore: "scss", // comma-separated string for paths to ignore
    // mount: [['/components', './node_modules']], // Mount a directory to a route.
    // middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
  });

async function main() {
  // Create the output dir first
  await mkdir("./dist").catch(() => {});

  if (process.argv.includes("--watch")) {
    watchMode();
    await copyHTML();
    // watchHTML();

    startDevServer();
  } else {
    copyHTML();
    const { metafile } = await build();
    await writeFile("./esbuild-metafile.json", JSON.stringify(metafile));
  }
}

main();
