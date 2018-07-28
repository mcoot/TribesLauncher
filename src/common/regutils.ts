import * as Registry from 'winreg';

const getRegistryValuesPromise = async (regKey: Registry.Registry): Promise<Registry.RegistryItem[]> {
    return new Promise((res: (items: Registry.RegistryItem[]) => void, rej: (err: Error) => void) => {
        regKey.values((err, items) => {
            if (err) {
                rej(err);
            } else {
                res(items);
            }
        });
    });
};

export const lookupRegistry = async (hive: string, path: string, item: string): Promise<Registry.RegistryItem | null> => {
    const regKey = new Registry({
        hive: hive,
        key: path
    });

    const values = await getRegistryValuesPromise(regKey);
    const result = values.find((regItem) => regItem.name === item);
    return result || null;
};