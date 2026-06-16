export const webStoreMap = new Map<string, any>();

/**
 * Lê uma instância da store interna da lib.
 *
 * @example
 * const user = getFromStore<UserProvider>('user')
 */
export const getFromStore = <T>(key: string): T | null => {
  return webStoreMap.get(key) || null;
};

/**
 * Salva uma instância na store interna da lib.
 *
 * @example
 * setToStore('user', userProvider)
 */
export const setToStore = (key: string, value: any) => {
  webStoreMap.set(key, value);
};

/**
 * Remove uma instância da store interna da lib.
 *
 * @example
 * removeFromStore('user')
 */
export const removeFromStore = (key: string) => {
  webStoreMap.delete(key);
};
