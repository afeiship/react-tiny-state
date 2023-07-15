// https://github.com/lukashala/react-simply/blob/master/tools/state/src/index.js
import React, { Fragment, createContext, useContext, useReducer } from 'react';
import type { Dispatch } from 'react';
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
  const state = {};
  nx.forIn(store, (key, value) => {
    const storeKey = nx.camelize(value.name || key);
    const storeState = nx.get(value, 'state');
    state[storeKey] = storeState;
  });
  return state;
};

export const StateContext = createContext<any>(null);

export const StateProvider = ({ store, children }) => {
  const initialState = getInitialState(store);
  const value = useReducer(reducer, initialState);

  nx.$set = (inKey, inValue) => {
    const state = value[0];
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
    return fn && fn.apply(ctx, args);
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
