import '@jswork/next';
import fn from '../src';
import { camelize, resolveModuleNameFromPath } from '../src/utils';

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

  test('registers multiple modules parsed from glob paths with arbitrary root folder', () => {
    const modules = {
      './m2/theme.ts': { state: { primary: 'blue' } },
      './any-folder/user-profile.ts': { state: { name: 'aric' } },
      '/src/stores/m2/counter.ts': { state: { count: 1 } },
    };
    const res = fn.$registerStores(modules);

    expect(Object.keys(res)).toEqual(['theme', 'user-profile', 'counter']);
    expect(fn.$get('theme.primary')).toBe('blue');
    expect(fn.$get('userProfile.name')).toBe('aric');
    expect(fn.$get('counter.count')).toBe(1);
  });

  test('registers nested directory modules and camelizes path (e.g. member/profile.ts -> memberProfile)', () => {
    const modules = {
      './modules/member/profile.ts': { state: { nickname: 'tom' } },
      './modules/member/orders.ts': { state: { total: 5 } },
      './modules/member/account/security.ts': { state: { twoFactor: true } },
    };
    const res = fn.$registerStores(modules);

    expect(Object.keys(res)).toEqual(['member-profile', 'member-orders', 'member-account-security']);
    expect(fn.$get('memberProfile.nickname')).toBe('tom');
    expect(fn.$get('memberOrders.total')).toBe(5);
    expect(fn.$get('memberAccountSecurity.twoFactor')).toBe(true);
  });

  test('strips /index from nested directory modules (e.g. member/index.ts -> member)', () => {
    const modules = {
      './modules/member/index.ts': { state: { level: 1 } },
    };
    fn.$registerStores(modules);
    expect(fn.$get('member.level')).toBe(1);
  });

  test('supports raw module objects with default export', () => {
    const modules = {
      './modules/cart.ts': { default: { state: { count: 3 } } },
    };
    fn.$registerStores(modules);
    expect(fn.$get('cart.count')).toBe(3);
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

  test('registers store immediately when name is provided in descriptor', () => {
    fn.$defineStore({ name: 'counter', state: { count: 10 } });
    expect(fn.$get('counter.count')).toBe(10);
  });

  test('name is optional; returns descriptor when name is omitted', () => {
    const desc = { state: { count: 0 } };
    const res = fn.$defineStore(desc);
    expect(res).toBe(desc);
    // Not registered yet until $registerStores assigns a name
    expect(fn.$get()).toEqual({});
  });

  test('supports function state', () => {
    fn.$defineStore({ name: 'cart', state: () => ({ items: [1, 2] }) });
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

describe('utils.resolveModuleNameFromPath', () => {
  test('resolves single level filename under arbitrary root directory', () => {
    expect(resolveModuleNameFromPath('./modules/counter.ts')).toBe('counter');
    expect(resolveModuleNameFromPath('./m2/counter.ts')).toBe('counter');
    expect(resolveModuleNameFromPath('/src/stores/modules/counter.ts')).toBe('counter');
  });

  test('resolves nested subdirectories with hyphen delimiter', () => {
    expect(resolveModuleNameFromPath('./modules/member/profile.ts')).toBe('member-profile');
    expect(resolveModuleNameFromPath('./m2/member/orders.ts')).toBe('member-orders');
    expect(resolveModuleNameFromPath('./m2/member/account/security.ts')).toBe('member-account-security');
  });

  test('strips trailing /index', () => {
    expect(resolveModuleNameFromPath('./modules/member/index.ts')).toBe('member');
    expect(resolveModuleNameFromPath('./m2/member/index.ts')).toBe('member');
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
