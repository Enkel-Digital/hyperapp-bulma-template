# Hyperapp-Bulma-Template
Github template repo to quickly start a project with hyperapp and bulma!


## Install / Develop / Build
### Install
```bash
# For development to install all normal and dev dependencies
npm install

# For production only, usually in your docker container
npm install --production
```

## Develop
Starts the file builder in watch mode and serve files using live-server
```bash
npm run start

# Both commands do the same thing!

npm run serve
```

## Build
Builds for production and writes output to /dist
```bash
npm run build
```

After building, you can also use <https://www.bundle-buddy.com/esbuild> to analyze your bundle using the generated `esbuild-metafile.json` file in your directory root.