import { EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, Injector, Provider } from '@angular/core';
import { setAppInjector } from '../core/web-injector.js';
import { WebLocalStorage } from '../services/web-local-storage.js';
import { WebGlobalOptions, setGlobalOptions } from './web-provider.options.js';

const provideWebLocalStorage = (): Provider => ({
  provide: WebLocalStorage,
  useFactory: () => new WebLocalStorage(),
});

/**
 * @deprecated Use `provideWebProviderInitializer`.
 */
export const provideWebProviderInitializerX = (providers: (Provider | EnvironmentProviders)[] | null | undefined = null): EnvironmentProviders => {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (injector: Injector) => () => {
        setAppInjector(injector);
        return Promise.resolve();
      },
      deps: [Injector],
      multi: true,
    },
    provideWebLocalStorage(),
    ...(providers || []),
  ]);
};

/**
 * Registra o injector Angular usado pela lib e define opções globais.
 *
 * Deve ser chamado uma vez no `app.config.ts`.
 *
 * @example
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideWebProviderInitializer({
 *       storage: 'sessionStorage',
 *       keyPrefix: 'admin',
 *       syncStorage: true,
 *     }),
 *   ],
 * };
 *
 * @example
 * provideWebProviderInitializer(undefined, [
 *   provideHttpClient(),
 * ])
 */
export const provideWebProviderInitializer = (
  options?: WebGlobalOptions,
  providers: (Provider | EnvironmentProviders)[] = []
): EnvironmentProviders => {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: (injector: Injector) => () => {
        setAppInjector(injector);
        if (options) {
          setGlobalOptions(options);
        }
        return Promise.resolve();
      },
      deps: [Injector],
      multi: true,
    },
    provideWebLocalStorage(),
    ...providers,
  ]);
};
