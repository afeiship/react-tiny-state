// https://github.com/lukashala/react-simply/blob/master/tools/state/src/index.js
import React, { Fragment, createContext, useContext, useReducer } from 'react';
import type { DispatchWithoutAction } from 'react';
import PropTypes from 'prop-types';

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
    case '__set__':
      // console.log(state, payload);
      return {
        ...state,
        ...payload,
      };
    default:
      return state;
  }
};

const getInitialState = (store) => {
  const state = { '@dps': {} };
  nx.forIn(store, (key, value) => {
    const storeKey = nx.camelize(value.name || key);
    const storeState = nx.get(value, 'state');
    state[storeKey] = storeState;
  });
  return state;
};

export const StateContext = createContext<any>(null);

const useForceUpdate = () => {
  const [, dispatch] = useReducer((x) => x + 1, 0);
  return dispatch as DispatchWithoutAction;
};

nx.$defineStore = function (inName: string, inDescriptor: any) {
  const { state, getters } = inDescriptor;
  nx.forIn(state, (key, value) => {
    Object.defineProperty(state, key, {
      set(inValue) {
        // not change:
        if (this[key] === inValue) return;

        // changed
        this[`@dps.__${key}__`] = inValue;
        console.log('set!');
        nx.$set([inName, key].join('.'), inValue);
        console.log('this', this);
      },
      get() {
        return this[`@dps.__${key}__`] || value;
      },
    });
  });

  return inDescriptor;
};

export const StateProvider = ({ store, children }) => {
  const initialState = getInitialState(store);
  const value = useReducer(reducer, initialState);
  const forceUpdate = useForceUpdate();

  nx.$set = function (inKey, inValue) {
    const state = value[0];
    // const hasModule = inKey.includes('.');
    // console.log(this, hasModule, inKey, inValue);
    const [module, path] = nx.slice2str(inKey, '.')!;
    const oldValue = nx.get(state, inKey);
    const newState = nx.set(state, inKey, inValue);
    const dispatch = value[1] as any;
    dispatch({ type: '__set__', payload: newState });

    // process watchers:
    const newValue = nx.get(state, inKey);
    const watchers = nx.get(store, [module, 'watch'].join('.'));
    nx.forIn(watchers, (key, watcher) => {
      if (key === path) watcher(newValue, oldValue);
    });
  };

  nx.$call = (inKey, ...args) => {
    const [module, method] = inKey.split('.');
    const path = [module, 'actions', method].join('.');
    const fn = nx.get(store, path);
    const ctx = store[module].state;
    const res = fn && fn.apply(ctx, args);

    forceUpdate();
    // force update
    return res;
  };
  // nx.$set = (inKey, inValue) =xx;
  // nx.$call = xxx;
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
};

StateProvider.propTypes = {
  /**
   * @return {React.Node}
   */
  children: PropTypes.node.isRequired,

  /**
   * Object containing initial state value.
   */
  store: PropTypes.any,
};

nx.$get = (inKey: string, inDefault?: any) => {
  const value = useContext(StateContext);
  const state = value[0];
  return nx.get(state, inKey, inDefault);
};
