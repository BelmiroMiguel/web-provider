import { ChangeDetectorRef, Injector, Type, inject, runInInjectionContext } from '@angular/core';

let appInjector: Injector | null = null;

const missingInitializerMessage = [
  '[web-provider] Provider não inicializado.',
  'Adicione provideWebProviderInitializer() aos providers do app.config.ts antes de usar webProvider().',
  'Exemplo: providers: [provideWebProviderInitializer()]',
].join(' ');

const getAppInjector = (): Injector => {
  if (!appInjector) {
    throw new Error(missingInitializerMessage);
  }

  return appInjector;
};

/**
 * Define manualmente o injector Angular usado pela lib.
 * Normalmente você deve preferir `provideWebProviderInitializer`.
 *
 * @example
 * setAppInjector(injector)
 */
export const setAppInjector = (injector: Injector) => {
  appInjector = injector;
};

/**
 * Resolve um serviço do injector Angular registrado.
 *
 * @example
 * const service = getService(UserApiService)
 */
export const getService = <T>(token: Type<T>): T => {
  return getAppInjector().get(token);
};

/**
 * Executa uma função dentro do contexto de injeção Angular da aplicação.
 *
 * @example
 * runInContext(() => inject(UserApiService))
 */
export const runInContext = <T>(fn: () => T): T => {
  return runInInjectionContext(getAppInjector(), fn);
};

/**
 * Tenta obter o `ChangeDetectorRef` do contexto atual.
 *
 * @example
 * getCurrentChangeDetector()?.markForCheck()
 */
export const getCurrentChangeDetector = (): ChangeDetectorRef | null => {
  try {
    return inject(ChangeDetectorRef);
  } catch (_error) {
    return null;
  }
};
