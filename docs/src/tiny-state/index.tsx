// https://github.com/lukashala/react-simply/blob/master/tools/state/src/index.js
import React, { createContext, useContext, useReducer } from 'react';
import type { Dispatch } from 'react';
import PropTypes from 'prop-types';

const reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (action.type) {
    case '__set__':
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

export const StateContext = createContext<typeof useReducer>({});

export const StateProvider = ({ store, children }) => {
  const initialState = getInitialState(store);
  const value = useReducer(reducer, initialState);

  console.log('initialState:', initialState);

  nx.$get = (inKey, inDefault) => {
    const state = value[0];
    return nx.get(state, inKey, inDefault);
  };

  nx.$set = (inKey, inValue) => {
    const state = value[0];
    const [module, path] = nx.slice2str(inKey, '.')!;
    const oldValue = nx.get(state, inKey);
    const newState = nx.set(state, inKey, inValue);
    const dispatch = value[1] as any;
    dispatch({ type: '__set__', action: newState });
    const newValue = nx.get(state, inKey);
    const watchers = nx.get(store, [module, 'watch'].join('.'));
    nx.forIn(watchers, (key, watcher) => {
      if (key === path) watcher(newValue, oldValue);
    });
  };

  nx.$call = (inKey, ...args) => {
    const state = value[0];
    const [module, method] = inKey.split('.');
    const path = [module, 'actions', method].join('.');
    const fn = nx.get(store, path);
    return fn && fn(...args);
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

export const useState = () => {
  const value = useContext(StateContext);
  // console.log('dispathc:', value);
  return value;
};
