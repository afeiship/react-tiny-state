// https://www.npmjs.com/package/@react-simply/state
// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c
const ReactTinyState = (): void => {
  console.log('hello');
};

// for commonjs es5 require
if (typeof module !== 'undefined' && module.exports && typeof wx === 'undefined') {
  module.exports = ReactTinyState;
}

export default ReactTinyState;
