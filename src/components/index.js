import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import noop from 'noop';
import objectAssign from 'object-assign';

const CLASS_NAME = 'react-filter';
const RETURN_VALUE = (inValue) => inValue;

export default class extends Component {
  static displayName = CLASS_NAME;

  /*===properties start===*/
  static propTypes = {
    items: PropTypes.array
  };

  static defaultProps = {
    items: [RETURN_VALUE]
  };
  /*===properties end===*/

  compose() {
    const { children, items } = this.props;
    return items.reduce((item1, item2) => {
      return item2(item1);
    }, children);
  }

  render() {
    return this.compose();
  }
}
