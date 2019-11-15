# react-filter
> Filters support for react.

## install
```shell
npm install -S afeiship/react-filter
```

## usage
1. import css
  ```scss
  @import "~react-filter/style.scss";

  // customize your styles:
  $react-filter-options: ()
  ```
2. import js
  ```js
  import ReactFilter from '../src/main';
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
          <ReactFilter items={[
            addZero(),
            toString(),
            addMore('abc', 'def')
          ]}>
            HelloPipe!
          </ReactFilter>
        </div>
      );
    }
  }

  ReactDOM.render(<App />, document.getElementById('app'));
  ```

## documentation
- https://afeiship.github.io/react-filter/
