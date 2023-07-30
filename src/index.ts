// https://www.npmjs.com/package/@react-simply/state
// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c
// https://playcode.io/1533196
// https://react.dev/reference/react/useReducer
// https://github.com/aric-tpls/react-tiny-state

import React, { createContext, useReducer, useState, useEffect, useContext } from 'react';
import nx from '@jswork/next';

// packages
import '@jswork/next-slice2str';
import '@jswork/next-camelize';
import '@jswork/next-invoke';

declare var wx: any;

const DPS_KEY = '__@dps@__';
const ACTION_SET = '__set__';
const StateContext = createContext<any>(null);

const reducer = (inState, inAction) => {
  const { type, payload } = inAction;
  switch (type) {
    case ACTION_SET:
      return {
        ...inState,
        ...payload,
      };
    default:
      return inState;
  }
};

const getInitialState = (inMainStore) => {
  const state = {};
  nx.forIn(inMainStore, (key, value) => {
    const storeKey = nx.camelize(value.name || key);
    const storeState = nx.get(value, 'state');
    state[storeKey] = storeState;
  });
  return state;
};

// ===== public method ====
nx.$defineStore = function (inName: string, inDescriptor: StoreDescriptor) {
  const { state: fnState, getters } = inDescriptor;
  const state = typeof fnState === 'function' ? fnState() : fnState;
  inDescriptor.state = state;

  // define for actions:
  nx.forIn(state, (key, value) => {
    if (key !== DPS_KEY) {
      const propName = `${DPS_KEY}.${key}`;

      Object.defineProperty(state, key, {
        set(inValue) {
          // not change:
          if (this[key] === inValue) return;

          // changed
          this[propName] = inValue;
        },
        get() {
          return typeof this[propName] === 'undefined' ? value : this[propName];
        },
      });
    }
  });

  // define getters:
  nx.forIn(getters, (key, value) => {
    Object.defineProperty(state, key, {
      get() {
        return value.call(state, state);
      },
    });
  });

  return inDescriptor;
};

nx.$use = (inKey: string, inDefault?: any) => {
  const value = useContext(StateContext);
  const state = value[0];
  return nx.get(state, inKey, inDefault);
};

const StateProvider = ({ store, children }: StateProviderProps) => {
  const initialState = getInitialState(store);
  const value = useReducer(reducer, initialState);

  nx.$get = (inKey: string, inDefault?) => {
    const state = value[0];
    return nx.get(state, inKey, inDefault);
  };

  nx.$set = function (inKey, inValue) {
    const state = value[0];
    const [module, path] = nx.slice2str(inKey, '.')!;
    const oldValue = nx.get(state, inKey);
    const newState = nx.set(state, inKey, inValue);
    const dispatch = value[1] as any;
    dispatch({ type: ACTION_SET, payload: newState });

    const newValue = nx.get(state, inKey);
    const watchers = nx.get(store, `${module}.watch`);

    nx.forIn(watchers, (key, watcher) => {
      if (key === path) watcher.call(state, newValue, oldValue);
    });
  };

  nx.$call = (inKey, ...args) => {
    const [module, method] = inKey.split('.');
    const path = `${module}.actions.${method}`;
    const fn = nx.get(store, path);
    const ctx = store[module].state;
    return nx.invoke(ctx, fn, args);
  };

  return React.createElement(StateContext.Provider, { value }, children);
};

// for commonjs es5 require
if (typeof module !== 'undefined' && module.exports && typeof wx === 'undefined') {
  module.exports = StateProvider;
}

export default StateProvider;
