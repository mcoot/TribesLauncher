import { Injector } from './injector';

console.log('INJECTING...');

Injector.inject('TribesAscend.exe', 'C:\\TAMods\\TAMods.dll').then(r => {
    console.log(`ENDED WITH CODE: ${r}`);
});