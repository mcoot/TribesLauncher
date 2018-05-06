const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller;
const path = require('path');

function getInstallerConfig() {
    console.log('Creating installer...');

    const rootPath = path.join('./');
    const outPath = path.join(rootPath, 'out');

    return Promise.resolve({
        appDirectory: path.join(outPath, 'tribeslauncher-win32-ia32'),
        title: 'TribesLauncher',
        authors: 'mcoot',
        noMsi: true,
        outputDirectory: path.join(outPath, 'installer'),
        exe: 'tribeslauncher.exe',
        setupExe: 'TribesLauncherSetup.exe',
        setupIcon: './src/main/icon.ico'
        // setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'icon.ico')
    });
}

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((err) => {
        console.error(err.message || err);
        process.exit(1);
    });