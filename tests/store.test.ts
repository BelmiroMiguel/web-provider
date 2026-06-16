import { describe, it, expect, beforeEach } from 'vitest';
import {
  webStoreMap,
  getFromStore,
  setToStore,
  removeFromStore,
} from '../src/core/store.js';

describe('store', () => {
  beforeEach(() => {
    webStoreMap.clear();
  });

  it('returns null when key does not exist', () => {
    expect(getFromStore('missing')).toBeNull();
  });

  it('stores and retrieves values', () => {
    setToStore('user', { name: 'Belmiro' });
    expect(getFromStore<{ name: string }>('user')).toEqual({ name: 'Belmiro' });
  });

  it('removes values from store', () => {
    setToStore('session', 'abc');
    removeFromStore('session');
    expect(getFromStore('session')).toBeNull();
  });
});
