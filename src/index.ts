// Provider
export { webProvider } from './provider/web-provider.js';

// Configuração Angular
export {
  provideWebProviderInitializer,
  provideWebProviderInitializerX,
} from './provider/web-provider-config.js';

// Opções
export type {
  WebProviderOptions,
  WebGlobalOptions,
  WebStorageType,
} from './provider/web-provider.options.js';
export { setGlobalOptions } from './provider/web-provider.options.js';

// Notifiers / base classes
export {
  WebNotifier,
  WebNotifierProvider,
  WebNotifierSignalProvider,
} from './notifier/web-notifier.js';

// WebRef e helpers
export { WebRef } from './core/web-ref.js';

// Injector
export {
  setAppInjector,
  getService,
  runInContext,
  getCurrentChangeDetector,
} from './core/web-injector.js';

// Storage
export { WebLocalStorage } from './services/web-local-storage.js';

// Store utilities
export {
  getFromStore,
  setToStore,
  removeFromStore,
} from './core/store.js';
