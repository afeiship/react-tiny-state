import '@jswork/next';
import fn from '../src';
import { camelize } from '../src/utils';

describe('api.basic', () => {
  beforeEach(() => fn.$resetStore());

  test('default export is the global nx', () => {
    expect(typeof fn.$defineStore).toBe('function');
    expect(fn).toBe((globalThis as any).nx);
  });

  test('exposes all global apis', () => {
    ['$defineStore', '$registerStores', '$get', '$set', '$call', '$use', '$resetStore'].forEach((key) => {
      expect(typeof fn[key]).toBe('function');
    });
  });
});

describe('api.$registerStores', () => {
  beforeEach(() => fn.$resetStore());

  test('registers multiple modules parsed from glob paths', () => {
    const modules = {
      './modules/theme.ts': { state: { primary: 'blue' } },
      './modules/user-profile.ts': { state: { name: 'aric' } },
    };
    const res = fn.$registerStores(modules);

    expect(Object.keys(res)).toEqual(['theme', 'user-profile']);
    expect(fn.$get('theme.primary')).toBe('blue');
    expect(fn.$get('userProfile.name')).toBe('aric');
  });

  test('respects descriptor.name override', () => {
    const modules = {
      './modules/ignored-filename.ts': { name: 'customModule', state: { val: 42 } },
    };
    fn.$registerStores(modules);
    expect(fn.$get('customModule.val')).toBe(42);
    expect(fn.$get('ignoredFilename')).toBeUndefined();
  });
});

describe('api.$defineStore', () => {
  beforeEach(() => fn.$resetStore());

  test('uses autoName and camelizes it', () => {
    fn.$defineStore({ state: { count: 0 } }, 'user-info');
    expect(fn.$get('userInfo.count')).toBe(0);
  });

  test('descriptor.name has higher priority than autoName', () => {
    fn.$defineStore({ name: 'theme', state: { primary: 'green' } }, 'other');
    expect(fn.$get('theme.primary')).toBe('green');
    expect(fn.$get('other')).toBeUndefined();
  });

  test('throws without name', () => {
    expect(() => fn.$defineStore({ state: {} })).toThrow();
  });

  test('supports function state', () => {
    fn.$defineStore({ state: () => ({ items: [1, 2] }) }, 'cart');
    expect(fn.$get('cart.items')).toEqual([1, 2]);
  });
});

describe('api.$get/$set', () => {
  beforeEach(() => {
    fn.$resetStore();
    fn.$defineStore(
      {
        state: { primary: 'green', child: { n1: { a: 123 } } },
      },
      'theme'
    );
  });

  test('reads nested path', () => {
    expect(fn.$get('theme.primary')).toBe('green');
    expect(fn.$get('theme.child.n1.a')).toBe(123);
  });

  test('returns entire store when path is omitted or empty', () => {
    expect(fn.$get()).toEqual({
      theme: { primary: 'green', child: { n1: { a: 123 } } },
    });
    expect(fn.$get('')).toEqual({
      theme: { primary: 'green', child: { n1: { a: 123 } } },
    });
  });

  test('returns default value on missing path', () => {
    expect(fn.$get('theme.missing', 'dv')).toBe('dv');
    expect(fn.$get('nope.module.x')).toBeUndefined();
  });

  test('writes nested path', () => {
    fn.$set('theme.child.n1.a', 456);
    expect(fn.$get('theme.child.n1.a')).toBe(456);
    expect(fn.$get('theme.primary')).toBe('green');
  });
});

describe('api.getter', () => {
  beforeEach(() => {
    fn.$resetStore();
    fn.$defineStore(
      {
        state: { profile: null },
        getters: {
          isLogin: (state: any) => !!state.profile?.login,
        },
      },
      'user'
    );
  });

  test('$get reads computed value', () => {
    expect(fn.$get('user.isLogin')).toBe(false);
    fn.$set('user.profile', { login: 'afei' });
    expect(fn.$get('user.isLogin')).toBe(true);
  });
});

describe('api.watch', () => {
  let flatCb: jest.Mock;
  let nestedCb: jest.Mock;

  beforeEach(() => {
    fn.$resetStore();
    flatCb = jest.fn();
    nestedCb = jest.fn();
    fn.$defineStore(
      {
        state: { primary: 'green', child: { n1: { a: 123 } } },
        watch: {
          primary: flatCb,
          'child.n1.a': nestedCb,
        },
      },
      'theme'
    );
  });

  test('fires with new/old value on module field change', () => {
    fn.$set('theme.primary', 'red');
    expect(flatCb).toHaveBeenCalledWith('red', 'green');
    expect(nestedCb).not.toHaveBeenCalled();
  });

  test('fires on nested path change (module-prefixed watch path)', () => {
    fn.$set('theme.child.n1.a', 456);
    expect(nestedCb).toHaveBeenCalledWith(456, 123);
    expect(flatCb).not.toHaveBeenCalled();
  });

  test('does not fire when value is deep-equal', () => {
    fn.$set('theme.child.n1', { a: 123 });
    expect(nestedCb).not.toHaveBeenCalled();
  });
});

describe('api.$call', () => {
  beforeEach(() => {
    fn.$resetStore();
    fn.$defineStore(
      {
        state: { profile: null as any },
        getters: {
          isLogin: (state: any) => !!state.profile?.login,
        },
        actions: {
          setProfile(state: any, getters: any, profile: any) {
            state.profile = profile;
            return getters.isLogin;
          },
          whoami() {
            return this.profile?.login;
          },
          greet(_state: any, _getters: any, prefix: string, suffix: string) {
            return `${prefix}${this.profile.login}${suffix}`;
          },
        },
      },
      'user'
    );
  });

  test('action receives module state as first argument', () => {
    const res = fn.$call('user.setProfile', { login: 'afei' });
    expect(res).toBe(true);
    expect(fn.$get('user.profile')).toEqual({ login: 'afei' });
  });

  test('action this points to module state', () => {
    fn.$call('user.setProfile', { login: 'afei' });
    expect(fn.$call('user.whoami')).toBe('afei');
    expect(fn.$call('user.greet', 'hi/', '!')).toBe('hi/afei!');
  });

  test('throws on unknown action', () => {
    expect(() => fn.$call('user.missing')).toThrow('action not found: user.missing');
  });
});

describe('api.$resetStore', () => {
  test('clears state so $get returns default value', () => {
    fn.$defineStore({ state: { primary: 'green' } }, 'theme');
    expect(fn.$get('theme.primary')).toBe('green');

    fn.$resetStore();
    expect(fn.$get('theme.primary')).toBeUndefined();
    expect(fn.$get('theme.primary', 'none')).toBe('none');
  });

  test('clears watch registrations', () => {
    const cb = jest.fn();
    fn.$defineStore({ state: { primary: 'green' }, watch: { primary: cb } }, 'theme');
    fn.$resetStore();

    // re-register state only, old watcher must stay unregistered
    fn.$defineStore({ state: { primary: 'green' } }, 'theme');
    fn.$set('theme.primary', 'red');
    expect(cb).not.toHaveBeenCalled();
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
