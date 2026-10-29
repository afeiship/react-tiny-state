# react-tiny-state
> Super simple state management for React apps.

[![version][version-image]][version-url]
[![license][license-image]][license-url]
[![size][size-image]][size-url]
[![download][download-image]][download-url]

## features
- Global singleton store + `useSyncExternalStore`, no `Provider` / no `Context` needed.
- Modular stores: `state` / `getters` / `actions` / `watch` per module.
- Nested path read/write via `nx.$get` / `nx.$set` (e.g. `user.profile.login`).
- Global `nx.$get / $set / $call` outside components, plus `nx.$use` hook inside components.
- Side-effect import: attaches the `$`-prefixed APIs onto the global `nx` (`@jswork/next`).

## installation
```shell
npm install @jswork/react-tiny-state
```

## usage

### 1. define store modules

```ts
// stores/modules/theme.ts
import '@jswork/next';

export default nx.$defineStore({
  state: {
    primary: 'green',
    child: { n1: { a: 123 } },
  },
  watch: {
    primary: (newValue, oldValue) => {
      console.log('theme primary changed:', newValue, oldValue);
    },
    'child.n1.a': (newValue, oldValue) => {
      console.log('nested value changed:', newValue, oldValue);
    },
  },
});
```

```ts
// stores/modules/user.ts
import '@jswork/next';

export default nx.$defineStore({
  state: {
    profile: null,
    session: null,
  },
  getters: {
    isLogin(state) {
      return !!state.profile?.login;
    },
  },
  actions: {
    async profile({ username }) {
      const res = await fetch(`https://api.github.com/users/${username}`).then((r) => r.json());
      nx.$set('user.profile', res);
    },
  },
});
```

### 2. compose stores

```ts
// stores/index.ts (Vite glob auto registration)
import nx from '@jswork/next';
import '@jswork/react-tiny-state';

export const stores = nx.$registerStores(
  import.meta.glob('./modules/*.ts', { eager: true, import: 'default' })
);

export default stores;
```

> You can also manually call `nx.$defineStore(descriptor, autoName)` per module. Each module key is camelized (`camelize`) when merged into the root state, so `theme` / `user` are accessed via `nx.$get('theme.*')` / `nx.$get('user.*')`.

### 3. load stores in your app

No `Provider` / no Context — just make sure the store modules are imported once in your app entry:

```tsx
import '@jswork/next';
import './stores'; // registers every module onto the global store

export default function App() {
  return <Comp1 />;
}
```

### 4. use in components

```tsx
const theme = nx.$get('theme'); // read whole module state
const isLogin = nx.$get('user.isLogin'); // read getter
const profile = nx.$get('user.profile.login'); // read nested path

// update state (triggers watchers + re-render)
nx.$set('theme.primary', 'red');
nx.$set('user.profile', { login: 'afeiship' });

// call an action (this inside action = module state)
nx.$call('user.profile', { username: 'afeiship' });
```

## api

This package has **no default export**. Importing it attaches the `$`-prefixed APIs onto the global `nx` (`@jswork/next`); it also re-exports the related types (`StoreModuleDef`, `Watcher`, `ActionFn`, `GetterFn`).

```ts
import '@jswork/next';
import '@jswork/react-tiny-state'; // side effect: nx.$defineStore / $get / $set / ... are ready
```

### nx.$defineStore(name, descriptor) / nx.$defineStore(descriptor, autoName?)
```ts
// 1. Name as first argument (Pinia style)
nx.$defineStore('counter', {
  state: { count: 0 },
  getters: { double: (state) => state.count * 2 },
  actions: { increment: (state) => nx.$set('counter.count', state.count + 1) },
});

// 2. Name inside descriptor
nx.$defineStore({
  name: 'theme',
  state: { primary: 'green' },
  watch: { primary: (newVal, oldVal) => console.log(newVal, oldVal) }
});
```

### nx.$registerStores(modules)
Batch register modules imported via Vite's `import.meta.glob`. Supports nested subdirectories and strips `/index`:
```ts
nx.$registerStores(import.meta.glob('./modules/**/*.ts', { eager: true, import: 'default' }));
```
- `modules/counter.ts` -> `counter`
- `modules/member/profile.ts` -> `memberProfile`
- `modules/member/orders.ts` -> `memberOrders`
- `modules/member/index.ts` -> `member`

State fields are proxied so assignment like `this.profile = res` works internally; getters are exposed as getter properties on the module state (read them via `nx.$get('user.isLogin')`).

### nx.$get(path, default?)
Read state synchronously anywhere, e.g. `nx.$get('theme.primary')`, `nx.$get('user.profile.login', null)`.

### nx.$set(path, value)
Write a nested path (supports dotted keys) and dispatch the update. Fires the matching `watch` watcher of that module.

### nx.$call(path, ...args)
Call an action: `nx.$call('user.profile', { username: 'afeiship' })`. Inside the action, `this` refers to the module state.

### nx.$use(path, default?)
React hook version of `$get`, usable inside components: `const count = nx.$use('theme.primary');`.

## license
Code released under [the MIT license](https://github.com/afeiship/react-tiny-state/blob/main/LICENSE.txt).

[version-image]: https://img.shields.io/npm/v/@jswork/react-tiny-state
[version-url]: https://npmjs.org/package/@jswork/react-tiny-state

[license-image]: https://img.shields.io/npm/l/@jswork/react-tiny-state
[license-url]: https://github.com/afeiship/react-tiny-state/blob/main/LICENSE.txt

[size-image]: https://img.shields.io/bundlephobia/minzip/@jswork/react-tiny-state
[size-url]: https://github.com/afeiship/react-tiny-state/blob/main/dist/react-tiny-state.min.js

[download-image]: https://img.shields.io/npm/dm/@jswork/react-tiny-state
[download-url]: https://www.npmjs.com/package/@jswork/react-tiny-state
