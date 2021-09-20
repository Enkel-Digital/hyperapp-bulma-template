#!/usr/bin/env node

const esbuild = require("esbuild");

const {
  rm,
  mkdir,
  copyFile,
  watch,
  readFile,
  writeFile,
  stat,
} = require("fs/promises");

// Wrapper function around esbuild with shared options, use function parameter to override default options
const builder = (options = {}) =>
  esbuild.build({
    // There are 2 main entry points linked from index.html, 1 for all the user JS files and 1 for bulma
    // Setting custom output path here to prevent esbuild from copying over the dir structure
    // In both development and production builds, bulma is written to dist/bulma.css before calling builder
    // https://esbuild.github.io/api/#entry-points
    entryPoints: { main: "src/main.js" },
    outdir: "dist",

    // Default shared options
    bundle: true,

    // @todo Might support other file types like images and more
    // https://esbuild.github.io/content-types/#external-file
    // plugins: [require("esbuild-plugin-sass")()],

    // Override default options if needed
    ...options,
  });

// Wrapper function around builder, use function parameter to override default options
const productionBuild = (options = {}) =>
  builder({
    minify: true,
    sourcemap: true,
    watch: false,
    metafile: true,

    // Override default options if needed
    ...options,
  });

// Wrapper function around builder, use function parameter to override default options
// This is for development use, watching files for changes and rebuilding when changed
// In watch mode, build without minifying, and since not minified no need for sourcemap
const developmentBuild = (options = {}) =>
  builder({
    minify: false,
    sourcemap: false,
    watch: true,
    metafile: false,

    // Override default options if needed
    ...options,
  });

const copyHTML = async () => copyFile("./src/index.html", "./dist/index.html");

// Watch HTML copies over the HTML at least once before watching for changes
// const watchHTML = async () => {
//   for await (const _ of watch("./src/index.html")) copyHTML();
// };

// Function to Treeshake/minify bulma library using purge CSS to remove unused classes
async function purgeCSS() {
  // Since only used during production build, only import dependency here when fn is called
  const { PurgeCSS } = require("purgecss");

  const purgeCSSResult = await new PurgeCSS().purge({
    // Look at all html and JS files, but primarily the JS files of the hyperapp project
    content: ["**/*.html", "**/*.js"],

    // Only loading the minified bulma css file for now
    // @todo Might let user/esbuild pass in files if there are user CSS files
    css: ["node_modules/bulma/css/bulma.min.css"],
  });

  // Since only minifying the bulma css file, there should only be 1 file output
  // Take the generated CSS string out from the first element (bulma lib) and return it
  return purgeCSSResult[0].css;
}

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
  });

async function main() {
  // Create the output dir first
  await mkdir("./dist").catch(() => {});

  if (process.argv.includes("--watch")) {
    copyHTML();
    // watchHTML();

    // In development builds, bulma lib is copied directly to dist/bulma.css without a minifying step
    readFile("node_modules/bulma/css/bulma.min.css").then((bulma) =>
      writeFile("./dist/bulma.css", bulma)
    );

    // Start server after finish building
    await developmentBuild();
    startDevServer();
  } else {
    copyHTML();

    // In production builds, bulma is pre processed and written to dist/bulma.css directly
    // Treeshake/minify bulma library using purge CSS to remove unused classes
    // Write minified code into dist directly as the final build output
    // Print minified CSS file size in kB (1000 bytes) like esbuild analyze with 1 decimal point
    // This process is fired off FIRST before esbuild process as purgeCSS is much slower,
    // Thus this is fired off and not awaited before starting esbuild concurrently.
    purgeCSS()
      .then((miniCSS) => writeFile("./dist/bulma.css", miniCSS))
      .then(() => stat("./dist/bulma.css"))
      .then((stat) =>
        console.log(
          `  dist/bulma.css ──────────────────── ${(stat.size / 1000).toFixed(
            1
          )}kB`
        )
      );

    // Build and get back the metafile
    const { metafile } = await productionBuild();
    // Fire off async task to Save metafile for user to use later with tools like bundle buddy
    writeFile("./esbuild-metafile.json", JSON.stringify(metafile));
    // Fire off a call to pretty print out a basic analysis using the metafile
    esbuild.analyzeMetafile(metafile, { verbose: true }).then(console.log);
  }
}

main();
