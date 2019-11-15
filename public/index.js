import ReactPipe from '../src/main';
import ReactDOM from 'react-dom';
import React from 'react';
import './assets/style.scss';

import addMore from './filters/add-more';
import toString from './filters/to-string';
import addZero from './filters/add-zero';

class App extends React.Component {
  componentDidMount() {}
  render() {
    return (
      <div className="app-container">
        <ReactPipe items={[
          addZero(),
          toString(),
          addMore('abc', 'def')
        ]}>
          HelloPipe!
        </ReactPipe>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
