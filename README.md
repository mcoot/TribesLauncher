# TribesLauncher
An attempt at reimplementing TAMods launcher with Typescript and Electron

## Setting up the dev environment

1. Make sure you have `yarn` installed

2. Run `yarn` in this directory to install dependencies

3. If `node-gyp` throws a hissy fit (it probably will), run `npm install --global --production windows-build-tools` from an administrative shell. This takes a while

4. Install `electron-forge`

5. To run the application, `electron-forge start`

6. Tests for various components exist as npm scripts - e.g. `yarn updaterTest` and `yarn injectorTest`

The C++ injector itself located under `./injector` contains a VS2017 solution which can be loaded and should deal with the build process for that.