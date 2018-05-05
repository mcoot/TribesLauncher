const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller;
const path = require('path');

function getInstallerConfig() {
    console.log('Creating installer...');

    const rootPath = path.join('./');
    const outPath = path.join(rootPath, 'out');

    return Promise.resolve({
        appDirectory: path.join(outPath, 'tribeslauncher-win32-ia32'),
        authors: 'mcoot',
        version: '0.1.0',
        noMsi: true,
        outputDirectory: path.join(outPath, 'installer'),
        exe: 'tribeslauncher.exe',
        setupExe: 'TribesLauncherSetup.exe',
        // setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'icon.ico')
    });
}

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((err) => {
        console.error(err.message || err);
        process.exit(1);
    });