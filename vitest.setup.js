import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const DETERMINISTIC_NOW = new Date('2026-10-16T00:00:00.000Z');

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  getItem(key) {
    const normalizedKey = String(key);
    return this.values.has(normalizedKey)
      ? this.values.get(normalizedKey)
      : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(String(key));
  }

  clear() {
    this.values.clear();
  }
}

function defineGlobalValue(name, value) {
  try {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
      writable: true,
    });
  } catch {
    try {
      globalThis[name] = value;
    } catch {
      // The test environment already provides a non-configurable implementation.
    }
  }
}

function ensureStorage(name) {
  if (
    globalThis[name] &&
    typeof globalThis[name].getItem === 'function' &&
    typeof globalThis[name].setItem === 'function' &&
    typeof globalThis[name].removeItem === 'function'
  ) {
    return;
  }

  defineGlobalValue(name, new MemoryStorage());
}

function ensureBlob() {
  if (typeof globalThis.Blob === 'function') {
    return;
  }

  class TestBlob {
    constructor(parts = [], options = {}) {
      this.type = typeof options.type === 'string' ? options.type : '';
      this.content = parts.map((part) => String(part)).join('');
      this.size = this.content.length;
    }

    async text() {
      return this.content;
    }
  }

  defineGlobalValue('Blob', TestBlob);
}

function ensureUrlApi() {
  if (!globalThis.URL) {
    defineGlobalValue('URL', {});
  }

  if (typeof globalThis.URL.createObjectURL !== 'function') {
    let objectUrlSequence = 0;

    try {
      globalThis.URL.createObjectURL = () => {
        objectUrlSequence += 1;
        return `blob:vitest-${objectUrlSequence}`;
      };
    } catch {
      Object.defineProperty(globalThis.URL, 'createObjectURL', {
        configurable: true,
        value: () => {
          objectUrlSequence += 1;
          return `blob:vitest-${objectUrlSequence}`;
        },
      });
    }
  }

  if (typeof globalThis.URL.revokeObjectURL !== 'function') {
    try {
      globalThis.URL.revokeObjectURL = () => {};
    } catch {
      Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
        configurable: true,
        value: () => {},
      });
    }
  }
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');
ensureBlob();
ensureUrlApi();
vi.setSystemTime(DETERMINISTIC_NOW);