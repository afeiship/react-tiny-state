export default (inValue, inArgs) => {
  return inArgs.reduce((arg1, arg2) => {
    return arg1 + arg2 + '';
  }, '======' + inValue);
};
