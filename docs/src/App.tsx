import '@jswork/next';
import { StateProvider } from './tiny-state';
import Comp1 from './comp1';

const userReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'set':
      return {
        ...state,
        ...action.payload,
      };
    case 'reset':
      return {
        ...state,
        ...action.payload,
      };
  }
};

const productReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'set':
      return {
        ...state,
        ...action.payload,
      };
    case 'reset':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

const mainReducer = (state: any, action: any) => {
  console.log('state/action:', state, action);
  const { type, ...payload } = action;
  switch (action.type) {
    case '__set__':
      return {
        ...state,
        ...payload,
      };
    case '__call__':
      console.log(action);
      break;
    default:
      return state;
  }

  return {
    user: userReducer(state.user, action),
    product: productReducer(state.product, action),
  };
};

export default function App() {
  const initialState = {
    theme: { primary: 'green' },
    user: {
      name: 'afeiship',
    },
    product: {
      name: 'next',
    },
    hello: (name: any) => {
      console.log(`hello ${name}`);
    },
  };

  // const reducer = (state, action) => {
  //   console.log('state/action:', state, action);
  //   const { type, ...payload } = action;
  //   switch (action.type) {
  //     case '__set__':
  //       return {
  //         ...state,
  //         ...payload,
  //       };
  //     case '__call__':
  //       console.log(action);
  //       break;
  //     default:
  //       return state;
  //   }
  // };

  return (
    <StateProvider initialState={initialState} reducer={mainReducer}>
      <Comp1 />
    </StateProvider>
  );
}
