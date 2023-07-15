export default {
  state: {
    primary: 'green',
    child: {
      n1: {
        a: 123,
      },
    },
  },
  actions: {},
  watch: {
    primary: (newValue: any, oldValue: any) => {
      console.log('them primary chagne: ', newValue, oldValue);
    },
    'child.n1'(newValue: any, oldValue: any) {
      console.log('when a change', newValue, oldValue);
    },
  },
};
