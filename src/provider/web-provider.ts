import { webStoreMap } from "../core/store.js";
import { getCurrentChangeDetector, runInContext } from "../core/web-injector.js";
import { WebRef } from "../core/web-ref.js";
import { WebProviderOptions, getGlobalOptions, providerMetadataMap } from "./web-provider.options.js";

interface ProviderLifecycle {
  init?: (key: string, syncStorage?: boolean) => void;
  destroy?: () => void;
}

type ProviderInstance<T extends object> = T & ProviderLifecycle;

/**
 * Cria ou recupera um provider singleton identificado por `key`.
 *
 * A factory roda dentro do contexto de injeção Angular configurado por
 * `provideWebProviderInitializer`, então serviços podem ser resolvidos com
 * `ref.inject(...)`.
 *
 * @example
 * export const userProvider = webProvider('user', (ref: WebRef) => {
 *   const api = ref.inject(UserApiService);
 *   return new UserProvider(api);
 * });
 *
 * @example
 * export const cartProvider = webProvider('cart', () => new CartProvider(), {
 *   ttl: 60_000,
 *   clearStorageOnExpire: true,
 * });
 */
export const webProvider = <T extends object>(
  key: string,
  factory: (ref: WebRef) => T,
  localOptions?: WebProviderOptions
): T => {
  const ref = new WebRef(webStoreMap);
  const componentCdr = getCurrentChangeDetector();

  if (!providerMetadataMap.has(key)) {
    providerMetadataMap.set(key, {
      createdAt: Date.now(),
      factory,
      options: { ...getGlobalOptions(), ...localOptions },
    });
  }

  let cachedInstance: ProviderInstance<T> | null = null;

  const getOrRecreateInstance = (): ProviderInstance<T> => {
    if (cachedInstance) return cachedInstance;

    const meta = providerMetadataMap.get(key)!;
    let instance = webStoreMap.get(key) as ProviderInstance<T> | undefined;
    const now = Date.now();

    if (instance && meta.options.ttl && (now - meta.createdAt) > meta.options.ttl) {
      instance.destroy?.();

      if (meta.options.clearStorageOnExpire) {
        ref.storage.removeItem(key);
      }

      webStoreMap.delete(key);
      instance = undefined;
      meta.createdAt = now;
    }

    if (!instance) {
      instance = ref.get(key, () => {
        return runInContext(() => {
          const createdInstance = meta.factory(ref) as ProviderInstance<T>;
          createdInstance.init?.(key, meta.options.syncStorage);
          return createdInstance;
        });
      });
    }

    cachedInstance = instance;
    return instance;
  };

  return new Proxy({} as T, {
    get(_, prop) {
      const instance = getOrRecreateInstance() as Record<PropertyKey, unknown>;
      const value = instance[prop];

      if (typeof value === 'function') {
        return value.bind(instance);
      }

      return value;
    },
    set(_, prop, value) {
      const instance = getOrRecreateInstance() as Record<PropertyKey, unknown>;
      instance[prop] = value;

      if (componentCdr) {
        componentCdr.markForCheck();
      }

      return true;
    }
  });
};
