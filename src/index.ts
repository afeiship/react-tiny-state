// https://www.npmjs.com/package/@react-simply/state
// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c
// https://playcode.io/1533196
// https://react.dev/reference/react/useReducer
// https://github.com/aric-tpls/react-tiny-state

import React, { createContext, useReducer, useState, useEffect } from 'react';
import nx from '@jswork/next';
import EventMitt from '@jswork/event-mitt';

// packages
import '@jswork/next-slice2str';
import '@jswork/next-camelize';
import '@jswork/next-invoke';

declare var wx: any;

const EVENT_BUS = Object.assign({}, EventMitt);
const DPS_KEY = '__@dps@__';
const CHANGE_EVENT = 'state.change';

const StateContext = createContext<any>(null);

const reducer = (inState, inAction) => {
  const { type, payload } = inAction;
  switch (type) {
    case '__set__':
      return {
        ...inState,
        ...payload,
      };
    default:
      return inState;
  }
};

const getInitialState = (inMainStore) => {
  const state = { [DPS_KEY]: {} };
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
      const propName = `${DPS_KEY}.${inName}.${key}`;

      Object.defineProperty(state, key, {
        set(inValue) {
          // not change:
          if (this[key] === inValue) return;

          // changed
          this[propName] = inValue;
          EVENT_BUS.emit(CHANGE_EVENT);
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

const StateProvider = ({ store, children }: StateProviderProps) => {
  const initialState = getInitialState(store);
  const value = useReducer(reducer, initialState);
  const [ts, setTs] = useState<number>();

  useEffect(() => {
    const res = EVENT_BUS.one(CHANGE_EVENT, () => setTs(Date.now()));
    return () => res.destroy();
  }, []);

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
    dispatch({ type: '__set__', payload: newState });

    const newValue = nx.get(state, inKey);
    const watchers = nx.get(store, `${module}.watch`);

    nx.forIn(watchers, (key, watcher) => {
      if (key === path) watcher(newValue, oldValue);
    });
  };

  nx.$call = (inKey, ...args) => {
    const [module, method] = inKey.split('.');
    const path = `${module}.actions.${method}`;
    const fn = nx.get(store, path);
    const ctx = store[module].state;

    EVENT_BUS.emit(CHANGE_EVENT);

    // force update
    return nx.invoke(ctx, fn, args);
  };

  return React.createElement(StateContext.Provider, { key: ts, value }, children);
};

// for commonjs es5 require
if (typeof module !== 'undefined' && module.exports && typeof wx === 'undefined') {
  module.exports = StateProvider;
}

export default StateProvider;
