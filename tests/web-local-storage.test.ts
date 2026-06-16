import { beforeEach, describe, expect, it } from 'vitest';
import { setGlobalOptions } from '../src/provider/web-provider.options.js';
import { WebLocalStorage } from '../src/services/web-local-storage.js';

describe('WebLocalStorage', () => {
  let storage: WebLocalStorage;

  beforeEach(() => {
    setGlobalOptions({
      storage: {
        type: 'memory',
        prefix: 'test_app',
      },
    });
    storage = new WebLocalStorage();
  });

  it('stores values using the configured prefix', () => {
    storage.setItem('user', { name: 'Belmiro' });

    expect(storage.getKey('user')).toBe('test_app:user');
    expect(storage.getItem<{ name: string }>('user', null)).toEqual({ name: 'Belmiro' });
  });

  it('removes prefixed keys', () => {
    storage.setItem('token', 'abc');
    expect(storage.has('token')).toBe(true);

    storage.removeItem('token');
    expect(storage.has('token')).toBe(false);
  });

  it('clears only keys from the configured prefix', () => {
    storage.setItem('one', 1);
    storage.setItem('two', 2);

    storage.clearAll();

    expect(storage.has('one')).toBe(false);
    expect(storage.has('two')).toBe(false);
  });
});
