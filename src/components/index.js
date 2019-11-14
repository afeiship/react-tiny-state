import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import noop from 'noop';
import objectAssign from 'object-assign';

const CLASS_NAME = 'react-filter';
const RETURN_VALUE = (inValue) => inValue;
const DEFAULT_FILTER = { fn: RETURN_VALUE, args: [] };

export default class extends Component {
  static displayName = CLASS_NAME;

  /*===properties start===*/
  static propTypes = {
    className: PropTypes.string,
    items: PropTypes.array
  };

  static defaultProps = {
    items: [DEFAULT_FILTER]
  };
  /*===properties end===*/

  compose() {
    const { children, items } = this.props;
    return items.reduce((item1, item2) => {
      return item2.fn(item1, item2.args);
    }, children);
  }

  render() {
    return this.compose();
  }
}
