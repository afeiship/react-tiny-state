# react-tiny-state
> Super simple state management for React apps.

[![version][version-image]][version-url]
[![license][license-image]][license-url]
[![size][size-image]][size-url]
[![download][download-image]][download-url]

## features
- Based on `React.createContext` + `useReducer`, ~10 lines of core logic.
- Modular stores: `state` / `getters` / `actions` / `watch` per module.
- Nested path read/write via `nx.$get` / `nx.$set` (e.g. `user.profile.login`).
- Global `nx.$get / $set / $call` outside components, plus `nx.$use` hook inside components.

## installation
```shell
npm install @jswork/react-tiny-state
```

## usage

### 1. define store modules

```ts
// stores/modules/theme.ts
import '@jswork/next';
import '@jswork/next-slice2str';
import '@jswork/next-camelize';
import '@jswork/next-invoke';

export default nx.$defineStore('theme', {
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
export default nx.$defineStore('user', {
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
// stores/index.ts
import theme from './modules/theme';
import user from './modules/user';

export default { theme, user };
```

> Each module key is camelized (`camelize`) when merged into the root state, so `theme` / `user` above are accessed via `nx.$get('theme')` / `nx.$get('user.*')`.

### 3. wrap your app

```tsx
import StateProvider from '@jswork/react-tiny-state';
import stores from './stores';

export default function App() {
  return (
    <StateProvider store={stores}>
      <Comp1 />
    </StateProvider>
  );
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

### StateProvider (default export)
```tsx
<StateProvider store={stores}>...</StateProvider>
```
Props: `store` (composed store modules), `children`. Merges every module's `state` into the root state and provides it through Context.

### nx.$defineStore(name, descriptor)
```ts
nx.$defineStore('theme', {
  state: {...},                 // module state
  getters: {...},               // computed values, `this` = module state
  actions: {...},               // methods, `this` = module state
  watch: {...},                 // path -> (newValue, oldValue), fired by nx.$set
});
```
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
Code released under [the MIT license](https://github.com/afeiship/react-tiny-state/blob/master/LICENSE.txt).

[version-image]: https://img.shields.io/npm/v/@jswork/react-tiny-state
[version-url]: https://npmjs.org/package/@jswork/react-tiny-state

[license-image]: https://img.shields.io/npm/l/@jswork/react-tiny-state
[license-url]: https://github.com/afeiship/react-tiny-state/blob/master/LICENSE.txt

[size-image]: https://img.shields.io/bundlephobia/minzip/@jswork/react-tiny-state
[size-url]: https://github.com/afeiship/react-tiny-state/blob/master/dist/react-tiny-state.min.js

[download-image]: https://img.shields.io/npm/dm/@jswork/react-tiny-state
[download-url]: https://www.npmjs.com/package/@jswork/react-tiny-state
