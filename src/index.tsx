// https://www.npmjs.com/package/@react-simply/state
// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c
// https://playcode.io/1533196
// https://react.dev/reference/react/useReducer

import React, { createContext, useReducer, useContext } from 'react';
import nx from '@jswork/next';

declare var wx: any;

type ContextType = ReturnType<typeof useReducer>;

const StateContext = createContext<ContextType>({} as ContextType);

const StateProvider = ({ reducer, initialState, children }) => {
  const value = useReducer(reducer, initialState);
  const [rootState, dispatch] = value;

  nx.$get = (inPath, inDefaultValue) => nx.get(rootState, inPath, inDefaultValue);
  nx.$set = (inPath, inValue) => dispatch({ type: '__set__', path: inPath, value: inValue });

  // nx.$root = value[0];
  // nx.$get = (inKey) = xx;
  // nx.$set = (inKey, inValue) =xx;
  // nx.$call = xxx;
  console.log('value: ', value);
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
};

// for commonjs es5 require
if (typeof module !== 'undefined' && module.exports && typeof wx === 'undefined') {
  module.exports = StateProvider;
}

export default StateProvider;
