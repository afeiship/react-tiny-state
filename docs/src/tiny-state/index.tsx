// https://github.com/lukashala/react-simply/blob/master/tools/state/src/index.js
import React, { Fragment, createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { DispatchWithoutAction } from 'react';
import PropTypes from 'prop-types';
import EventMitt from '@jswork/event-mitt';

const eventBus = Object.assign({}, EventMitt);
const DPS_KEY = '__@dps@__';

const reducer = (state, action) => {
  const { type, payload } = action;
  switch (type) {
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
  const state = { [DPS_KEY]: {} };
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
    if (key !== DPS_KEY) {
      Object.defineProperty(state, key, {
        set(inValue) {
          // not change:
          if (this[key] === inValue) return;

          // changed
          this[`${DPS_KEY}.${key}`] = inValue;
          nx.$set([inName, key].join('.'), inValue);
          eventBus.emit('state.change');
        },
        get() {
          return this[`${DPS_KEY}.${key}`] || value;
        },
      });
    }
  });

  nx.forIn(getters, (key, value) => {
    Object.defineProperty(state, key, {
      get() {
        return value.call(state, state);
      },
    });
  });

  return inDescriptor;
};

export const StateProvider = ({ store, children }) => {
  const initialState = getInitialState(store);
  const value = useReducer(reducer, initialState);
  const [ts, setTs] = useState<number>();

  useEffect(() => {
    eventBus.one('state.change', () => setTs(Date.now()));
  }, []);

  // forceUpdate();

  nx.$get = (inKey: string, inDefault?) => {
    const state = value[0];
    return nx.get(state, inKey, inDefault);
  };

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
    // const res = fn && fn.apply(ctx, args);

    eventBus.emit('state.change');
    console.log(ctx, path);

    // force update
    return nx.invoke(ctx, fn, args);
  };
  // nx.$set = (inKey, inValue) =xx;
  // nx.$call = xxx;
  return (
    <StateContext.Provider key={ts} value={value}>
      {children}
    </StateContext.Provider>
  );
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
