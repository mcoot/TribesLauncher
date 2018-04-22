import { Injector } from './injector';
import { generateDefaultConfig } from '../launcher-config';

console.log('INJECTING...');

Injector.inject("TribesAscend.exe", "C:\\TAMods\\TAMods.dll").then(r => {
    console.log(`ENDED WITH CODE: ${r}`);
});
// Injector.startProcess(generateDefaultConfig());