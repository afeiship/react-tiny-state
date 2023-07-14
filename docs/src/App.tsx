import React from 'react';
import '@jswork/next';
import { StateProvider } from './tiny-state';
import Comp1 from './comp1';

export default function App(props) {
  const initialState = {
    theme: { primary: 'green' },
  };

  const reducer = (state, action) => {
    console.log('state/action:', state, action);
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

  return (
    <StateProvider initialState={initialState} reducer={reducer} at>
      <Comp1 />
    </StateProvider>
  );
}

// Log to console
console.log('Hello console');
