// https://github.com/lukashala/react-simply/blob/master/tools/state/src/index.js
import React, { createContext, useContext, useReducer } from 'react';
import type { Dispatch } from 'react';
import PropTypes from 'prop-types';

export const StateContext = createContext(null);

export const StateProvider = ({ reducer, initialState, children }) => {
  const value = useReducer(reducer, initialState);

  nx.$root = value[0];
  nx.$get = (inKey, inDefault) => {
    const state = value[0];
    return nx.get(state, inKey, inDefault);
  };

  nx.$set = (inKey, inValue) => {
    const state = value[0];
    const newState = nx.set(state, inKey, inValue);
    const dispatch = value[1] satisfies Dispatch<any>;
    dispatch({ type: '__set__', newTheme: newState });
  };
  nx.$call = (inKey, ...args) => {
    const state = value[0];
    const fn = nx.get(state, inKey);
    fn && fn(...args);
  }
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
  initialState: PropTypes.shape({}).isRequired,

  /**
   *
   * @param {object} state
   * @param {object} action
   */
  reducer: PropTypes.func.isRequired,
};

export const useState = () => {
  const value = useContext(StateContext);
  // console.log('dispathc:', value);
  return value;
};
