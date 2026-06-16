import { getGlobalOptions, WebStorageType } from '../provider/web-provider.options.js';

/**
 * Serviço de persistência usado pelos providers da lib.
 *
 * Ele serializa valores em JSON, aplica um prefixo nas chaves e usa o storage
 * configurado em `provideWebProviderInitializer`.
 *
 * @example
 * provideWebProviderInitializer({
 *   storage: 'sessionStorage',
 *   keyPrefix: 'admin_panel',
 * })
 *
 * @example
 * class UserProvider extends WebNotifierProvider<UserState> {
 *   clear() {
 *     this.storage.removeItem('user');
 *   }
 * }
 */
export class WebLocalStorage {
  private readonly memoryStorage = new Map<string, string>();

  private get storageType(): WebStorageType {
    return getGlobalOptions().storage?.type ?? 'localStorage';
  }

  /**
   * Retorna a chave real gravada no browser storage.
   *
   * @example
   * storage.getKey('user') // "web-provider:user"
   */
  getKey(key: string): string {
    const prefix = getGlobalOptions().storage?.prefix || 'web-provider-app';
    return `${prefix}:${key}`;
  }

  private get storage(): Storage | null {
    try {
      if (this.storageType === 'memory') return null;
      return globalThis[this.storageType] ?? null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Salva um valor serializado em JSON no storage configurado.
   *
   * @example
   * storage.setItem('user', { name: 'Belmiro' })
   */
  setItem<T>(key: string, value: T): void {
    const storageKey = this.getKey(key);

    try {
      const payload = JSON.stringify(value);
      const storage = this.storage;

      if (storage) {
        storage.setItem(storageKey, payload);
      } else {
        this.memoryStorage.set(storageKey, payload);
      }
    } catch (error) {
      console.error(`[web-provider] Error saving key "${storageKey}"`, error);
    }
  }

  /**
   * Lê e desserializa um valor do storage configurado.
   *
   * @example
   * const user = storage.getItem<UserState>('user', { name: '' })
   */
  getItem<T>(key: string, defaultValue: T | null): T | null {
    const storageKey = this.getKey(key);

    try {
      const item = this.storage?.getItem(storageKey) ?? this.memoryStorage.get(storageKey);

      if (!item) return defaultValue;

      return JSON.parse(item) as T;
    } catch (_error) {
      console.warn(`[web-provider] Corrupted data on key "${storageKey}", resetting...`);
      this.removeItem(key);
      return defaultValue;
    }
  }

  /**
   * Remove uma chave do storage configurado.
   *
   * @example
   * storage.removeItem('user')
   */
  removeItem(key: string): void {
    const storageKey = this.getKey(key);
    this.storage?.removeItem(storageKey);
    this.memoryStorage.delete(storageKey);
  }

  /**
   * Remove apenas as chaves que usam o prefixo configurado.
   *
   * @example
   * storage.clearAll()
   */
  clearAll(): void {
    const prefix = `${getGlobalOptions().storage?.prefix || 'web-provider-app'}:`;
    const storage = this.storage;

    if (storage) {
      for (let index = storage.length - 1; index >= 0; index--) {
        const key = storage.key(index);
        if (key?.startsWith(prefix)) {
          storage.removeItem(key);
        }
      }
    }

    for (const key of this.memoryStorage.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStorage.delete(key);
      }
    }
  }

  /**
   * Verifica se uma chave existe no storage configurado.
   *
   * @example
   * if (storage.has('user')) {
   *   // existe estado persistido
   * }
   */
  has(key: string): boolean {
    const storageKey = this.getKey(key);
    const item = this.storage?.getItem(storageKey);
    return item !== null && item !== undefined || this.memoryStorage.has(storageKey);
  }
}
