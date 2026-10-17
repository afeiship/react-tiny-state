import fn from '../src';
import { camelize, slice2str, invoke } from '../src/utils';

describe('api.basic', () => {
  test('default export is the provider component', () => {
    expect(typeof fn).toBe('function');
  });
});

describe('utils.camelize', () => {
  test('basic camelize', () => {
    expect(camelize('user-info')).toBe('userInfo');
    expect(camelize('user_name')).toBe('userName');
    expect(camelize('user.name')).toBe('userName');
    expect(camelize('user-info_name.test')).toBe('userInfoNameTest');
  });

  test('empty input throws (parity with next-camelize)', () => {
    expect(() => camelize('')).toThrow();
  });

  test('first char lowercased', () => {
    expect(camelize('Foo-bar')).toBe('fooBar');
  });
});

describe('utils.slice2str', () => {
  test('split by separator', () => {
    expect(slice2str('user.profile', '.')).toEqual(['user', 'profile']);
    expect(slice2str('a.b.c', '.')).toEqual(['a', 'b.c']);
  });

  test('split by index', () => {
    expect(slice2str('hello', 2)).toEqual(['he', 'llo']);
    // index + step skips the separator char
    expect(slice2str('hello', 2, 1)).toEqual(['he', 'lo']);
  });

  test('empty input returns undefined', () => {
    expect(slice2str('', 0)).toBeUndefined();
  });
});

describe('utils.invoke', () => {
  test('invoke function with args', () => {
    const ctx = {
      base: 10,
      add(n: number) {
        return this.base + n;
      },
    };
    expect(invoke(ctx, 'add', [5])).toBe(15);
    expect(invoke(ctx, 'add', 5)).toBe(15);
  });

  test('invoke direct function', () => {
    const fn = (a: number, b: number) => a + b;
    expect(invoke(null, fn, [1, 2])).toBe(3);
  });

  test('non-function path returns undefined', () => {
    const ctx = { x: 1 };
    expect(invoke(ctx, 'missing')).toBeUndefined();
  });

  test('matches nx slot style (ctx, path, ...args)', () => {
    const obj = {
      name: 'afei',
      hello(prefix: string) {
        return `${prefix} ${this.name}`;
      },
    };
    const out = invoke(obj, 'hello', ['hi']);
    expect(out).toBe('hi afei');
  });
});