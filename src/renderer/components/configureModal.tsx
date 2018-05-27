import * as React from 'react';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import { remote, ipcRenderer } from 'electron';
import { Modal, Form, Icon, Button, Header, DropdownItemProps } from 'semantic-ui-react';
import * as ini from 'ini';

import { LauncherConfig } from '../../common/launcher-config';
import { LauncherNews, IniPreset } from '../../common/launcher-news';
import TAModsUpdater from '../../common/updater';

export interface LoadedIni extends IniPreset {
    resX: number;
    resY: number;
    fpsCap: number | null;
    fullscreen: boolean;
    borderless: boolean;
    rawData: any;
}

const CURRENT_INI_CONSTANT = '<current>';

const extractIni = (inputIni: any): LoadedIni => {
    const parseBoolKey = (val: string | null): boolean | null => {
        if (!val) {
            return null;
        }
        if (val.toLowerCase() === 'true') {
            return true;
        }
        if (val.toLowerCase() === 'false') {
            return false;
        }
        return null;
    };

    try {
        const fpsCap = inputIni.TribesGame && parseBoolKey(inputIni.TribesGame.TrGameEngine.bSmoothFrameRate) || null;
        const fullscreen = inputIni.SystemSettings && parseBoolKey(inputIni.SystemSettings.Fullscreen);
        const borderless = inputIni.SystemSettings && parseBoolKey(inputIni.SystemSettings.Borderless);
        const result: LoadedIni = {
            name: inputIni.TribesLauncher && inputIni.TribesLauncher.Name || 'Custom',
            description: inputIni.TribesLauncher && inputIni.TribesLauncher.Description || '',
            category: inputIni.TribesLauncher && inputIni.TribesLauncher.Category || '',
            remotePath: '',
            resX: inputIni.SystemSettings && parseInt(inputIni.SystemSettings.ResX) || 1920,
            resY: inputIni.SystemSettings && parseInt(inputIni.SystemSettings.ResY) || 1080,
            fpsCap: inputIni.TribesGame && (fpsCap ? null : parseInt(inputIni.TribesGame.TrGameEngine.MaxSmoothedFrameRate)) || null,
            fullscreen: fullscreen === null ? true : fullscreen,
            borderless: borderless === null ? false : borderless,
            rawData: inputIni
        };

        return result;
    } catch (err) {
        console.log(err);
    }
    return {
        name: 'Custom',
        description: '',
        category: '',
        remotePath: '',
        resX: 1920,
        resY: 1080,
        fpsCap: null,
        fullscreen: true,
        borderless: false,
        rawData: inputIni
    };
};

const saveIni = async (editedIni: LoadedIni, iniLocation: string): Promise<void> => {
    const iniData = editedIni.rawData;

    if (!iniData.TribesLauncher) {
        iniData.TribesLauncher = {};
    }
    if (!iniData.SystemSettings) {
        iniData.SystemSettings = {};
    }
    if (!iniData.TribesGame) {
        iniData.TribesGame = {};
    }
    if (!iniData.TribesGame.TrGameEngine) {
        iniData.TribesGame.TrGameEngine = {};
    }

    iniData.TribesLauncher.Name = editedIni.name;
    iniData.TribesLauncher.Description = editedIni.description;
    iniData.TribesLauncher.Category = editedIni.category;
    iniData.SystemSettings.ResX = editedIni.resX;
    iniData.SystemSettings.ResY = editedIni.resY;
    iniData.TribesGame.TrGameEngine.bSmoothFrameRate = editedIni.fpsCap !== null ? 'True' : 'False';
    if (editedIni.fpsCap !== null) {
        iniData.TribesGame.TrGameEngine.MaxSmoothedFrameRate = editedIni.fpsCap;
    }
    iniData.SystemSettings.Fullscreen = editedIni.fullscreen ? 'True' : 'False';
    iniData.SystemSettings.Borderless = editedIni.borderless ? 'True' : 'False';

    await fs.remove(iniLocation);
    await fs.writeFile(iniLocation, ini.encode(iniData));
};

export interface ConfigureModalProps {
    config: LauncherConfig;
    news: LauncherNews | null;
    userDataPath: string | null;
    userConfigPath: string | null;
    onUninstallComplete: () => void;
}

export interface ConfigureModalState {
    open: boolean;
    currentIni: LoadedIni;
    editedIni: LoadedIni;
    selectedCategory: string;
    selectedPreset: string;
}

export class ConfigureModal extends React.Component<ConfigureModalProps, ConfigureModalState> {

    constructor(props: ConfigureModalProps) {
        super(props);
        this.state = {
            open: false,
            currentIni: extractIni({}),
            editedIni: extractIni({}),
            selectedCategory: '',
            selectedPreset: CURRENT_INI_CONSTANT
        };
    }

    onModalOpen = async () => {
        // Find current tribes.ini
        if (this.props.userConfigPath && fs.existsSync(`${this.props.userConfigPath}/tribes.ini`)) {
            try {
                const iniData = ini.decode(await fs.readFile(`${this.props.userConfigPath}/tribes.ini`, 'utf8'));
                const existingIni = extractIni(iniData);
                this.setState((s) => ({
                    open: s.open,
                    currentIni: existingIni,
                    editedIni: existingIni,
                    selectedCategory: existingIni.category,
                    selectedPreset: existingIni.name
                }));
            } catch (err) {
                console.error('Failed to load INI');
            }
        }

        this.setState((s) => ({
            open: true,
            currentIni: s.currentIni,
            editedIni: s.editedIni,
            selectedCategory: s.selectedCategory,
            selectedPreset: s.selectedPreset
        }));
    }

    onModalClose = () => {
        this.setState((s) => ({
            open: false,
            currentIni: s.currentIni,
            editedIni: s.editedIni,
            selectedCategory: s.selectedCategory,
            selectedPreset: s.selectedPreset
        }));
    }

    onSetupUbermenuClick = async () => {
        if (!this.props.userConfigPath) {
            return;
        }

        // The config directory must already exist
        if (!fs.pathExistsSync(this.props.userConfigPath)) {
            return;
        }

        // Check for existing presets
        if (fs.existsSync(`${this.props.userConfigPath}/config.lua`)) {
            const existingConfig = await fs.readFile(`${this.props.userConfigPath}/config.lua`, 'utf8');
            const existingRequires = existingConfig.split('\n').map((line: string) => {
                const m = /^\s*require\("([\w\d\./]+)"\)/.exec(line);
                if (!m) {
                    return null;
                }
                return m[1];
            }).filter(e => e);
            const existingPresets = existingRequires.filter((req: string) => req.startsWith('presets/'));

            // Check for ubermenu specifically
            if (existingPresets.indexOf('presets/ubermenu/preset') !== -1) {
                remote.dialog.showErrorBox('Error enabling Ubermenu', 'Ubermenu is already enabled in your config file.');
                return;
            }

            // Don't set if other presets are active
            if (existingPresets.length > 0) {
                remote.dialog.showErrorBox('Error enabling Ubermenu',
                'Other presets are already enabled in your config. Please enable Ubermenu manually or via the external config tool.');
                return;
            }
        }

        const configLua = `-- Ubermenu preset\nrequire("presets/ubermenu/preset")\n`;

        await fs.appendFile(`${this.props.userConfigPath}/config.lua`, configLua);
    }

    onLaunchConfigToolClick = () => {
        if (!fs.existsSync(this.props.config.configToolPath)) {
            remote.dialog.showErrorBox('Config tool not found', 'Could not locate the configuration tool. You may need to update TAMods first.');
            return;
        }

        // Launch the config tool completely detached
        const child = spawn(this.props.config.configToolPath, [], { detached: true, stdio: 'ignore'});
        child.unref();
    }

    onForceReinstallClick = async () => {
        if (!fs.existsSync(`${this.props.userDataPath || '.'}/${TAModsUpdater.versionFile}`)) {
            return;
        }

        const response = remote.dialog.showMessageBox({
            type: 'warning',
            title: 'Warning',
            message: 'This will delete your local TAMods, which may cause the loss of some configuration settings. \
                      Are you sure you want to proceed?',
            buttons: ['Yes', 'No'],
            cancelId: 1
        });

        if (response !== 0) {
            return;
        }

        // Call for deletion
        ipcRenderer.once('uninstall-finished-request', () => {
            this.props.onUninstallComplete();
            remote.dialog.showMessageBox({
                type: 'info',
                title: 'Uninstall Complete',
                message: 'Local TAMods installation has been deleted. Ready for re-install.'
            });
        });

        ipcRenderer.send('uninstall-start-request', [this.props.config.releaseChannel, this.props.userDataPath || '.']);
    }

    onCategorySelect = (_: any, {value}: {value: string}) => {
        this.setState((s) => ({
            open: s.open,
            currentIni: s.currentIni,
            editedIni: s.editedIni,
            selectedCategory: value,
            selectedPreset: s.selectedPreset
        }));
    }

    onPresetSelect = (_: any, {value}: {value: string}) => {
        this.setState((s) => ({
            open: s.open,
            currentIni: s.currentIni,
            editedIni: s.editedIni,
            selectedCategory: s.selectedCategory,
            selectedPreset: value
        }));
    }

    onGraphicsFormChange = (_: any, {name, value}: {name: string, value: any}) => {
        const newIni: LoadedIni = JSON.parse(JSON.stringify(this.state.editedIni));
        let cName: string | null = name;

        switch (cName) {
            case 'doFpsCap':
                cName = 'fpsCap';
                value = (value === 1 ? null : (this.state.currentIni.fpsCap || 144));
                break;
            case 'fullscreen':
                cName = null;
                newIni.fullscreen = true;
                newIni.borderless = false;
                break;
            case 'borderless':
                cName = null;
                newIni.fullscreen = false;
                newIni.borderless = true;
                break;
            case 'windowed':
                cName = null;
                newIni.fullscreen = false;
                newIni.borderless = false;
                break;
        }

        if (cName) {
            newIni[cName] = value;
        }

        this.setState((s) => ({
            open: s.open,
            currentIni: s.currentIni,
            editedIni: newIni,
            selectedCategory: s.selectedCategory,
            selectedPreset: s.selectedPreset
        }));
    }

    onGraphicsSettingsApply = async () => {
        const finalIni: LoadedIni = JSON.parse(JSON.stringify(this.state.editedIni));

        if (this.state.selectedPreset === CURRENT_INI_CONSTANT) {
            // Don't need to download a new INI
            await saveIni(finalIni, `${this.props.userConfigPath}/tribes.ini`);
        }

        const response = remote.dialog.showMessageBox({
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Warning',
            message: 'Applying these changes will overwrite your current tribes.ini graphics preset. Do you wish to continue?'
        });
        if (response !== 0) {
            return;
        }

        // Download the new INI
        ipcRenderer.send('retrieve-ini-request', `${this.props.config.updateUrl}/${finalIni.remotePath}`);
        ipcRenderer.once('retrieve-ini-finished', async (event: any, args: any[]) => {
            if (!args[0]) {
                remote.dialog.showMessageBox({
                    type: 'error',
                    title: 'Error',
                    message: `Failed to download INI preset: ${args[1]}`
                });
                return;
            }
            finalIni.rawData = args[1];
            await saveIni(finalIni, `${this.props.userConfigPath}/tribes.ini`);
        });
    }

    render() {
        const categoryOptions: DropdownItemProps[] = (this.props.news && (
            this.props.news.iniPresets
                .filter((p, i, arr) => arr.findIndex((p2) => p.category === p2.category) === i)
                .map((p) => p.category)
                .sort()
                .map((cat) => ({text: cat, value: cat}))
        )) || [];

        const presetOptions: DropdownItemProps[] = ((this.props.news && (
            this.props.news.iniPresets
            .filter((p) => p.category === this.state.selectedCategory)
            .map((p) => p.name)
            .sort()
            .map((name) => ({text: name, value: name}))
        )) || [])
        .concat({text: this.state.currentIni.name, value: CURRENT_INI_CONSTANT});

        return (
            <Modal open={this.state.open} onClose={this.onModalClose} trigger={
                <Button compact size={'tiny'} icon onClick={this.onModalOpen}>
                    <Icon name='configure' />
                    Configure T:A
                </Button>
            }>
            <Modal.Header>
                Tribes Settings
            </Modal.Header>
            <Modal.Content>
                {/* <Header content='Graphics Settings'/> */}
                {/* <Form>
                    <Header size='small' content='Graphics Preset'/>
                    <Form.Group>
                        <Form.Dropdown
                            name={'iniPresetCategory'}
                            options={categoryOptions}
                            value={this.state.selectedCategory}
                            selection
                            label='Category'
                            placeholder='Category'
                            onChange={this.onCategorySelect}
                        />
                        <Form.Dropdown
                            name={'iniPresetName'}
                            options={presetOptions}
                            value={this.state.selectedPreset}
                            selection
                            label='Preset'
                            placeholder='Preset'
                            onChange={this.onPresetSelect}
                        />
                    </Form.Group>
                    <Header size='small' content='Video Output'/>
                    <Form.Group>
                        <Form.Input
                            type='number'
                            name={'resX'}
                            value={this.state.editedIni.resX}
                            label='Resolution Width'
                            onChange={this.onGraphicsFormChange}
                        />
                        <Form.Input
                            type='number'
                            name={'resY'}
                            value={this.state.editedIni.resY}
                            label='Resolution Height'
                            onChange={this.onGraphicsFormChange}
                        />
                        <Form.Input type='number' name={'fpsCap'}
                            value={this.state.editedIni.fpsCap || 0}
                            disabled={this.state.editedIni.fpsCap === null}
                            label='Frame Rate Limit'
                            onChange={this.onGraphicsFormChange}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Checkbox
                            name={'doFpsCap'}
                            checked={this.state.editedIni.fpsCap !== null}
                            value={this.state.editedIni.fpsCap !== null ? 1 : 0}
                            label='Limit FPS'
                            onChange={this.onGraphicsFormChange}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Radio
                            name={'fullscreen'}
                            checked={this.state.editedIni.fullscreen}
                            label='Fullscreen'
                            onChange={this.onGraphicsFormChange}
                        />
                        <Form.Radio
                            name={'borderless'}
                            checked={this.state.editedIni.borderless}
                            label='Borderless'
                            onChange={this.onGraphicsFormChange}
                        />
                        <Form.Radio
                            name={'windowed'}
                            checked={!this.state.editedIni.fullscreen && !this.state.editedIni.borderless}
                            label='Windowed'
                            onChange={this.onGraphicsFormChange}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Button compact onClick={this.onGraphicsSettingsApply} positive>
                            <Icon name='save' />
                            Apply Graphics Settings
                        </Form.Button>
                    </Form.Group>
                </Form> */}
                <Header content='TAMods Settings'/>
                <Button compact onClick={this.onSetupUbermenuClick}>Enable Ubermenu Preset</Button>
                <Button compact onClick={this.onLaunchConfigToolClick}>Launch External Config Tool</Button>
                <Button compact onClick={this.onForceReinstallClick}>Force Reinstall</Button>
            </Modal.Content>
            <Modal.Actions>
                    <Button compact onClick={this.onModalClose}>
                        <Icon name='close' />
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }

}