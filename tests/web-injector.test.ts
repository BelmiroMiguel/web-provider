import { describe, expect, it } from 'vitest';
import { runInContext } from '../src/core/web-injector.js';

describe('web injector', () => {
  it('explains how to initialize web-provider before using providers', () => {
    expect(() => runInContext(() => null)).toThrow(
      '[web-provider] Provider não inicializado. Adicione provideWebProviderInitializer() aos providers do app.config.ts antes de usar webProvider().'
    );
  });
});
