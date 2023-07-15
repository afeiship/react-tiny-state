export default {
  state: {
    profile: null,
    session: null,
  },
  actions: {
    hello() {
      console.log('i am user');
    },
    async profile() {
      const res = await fetch('https://api.github.com/users/afeiship').then((r) => r.json());
      console.log(res, this);
      // this.profile = res;
      nx.$set('user.profile', res);
    },
  },
  watch: {
    session(newValue) {
      console.log('session change: ', newValue);
    },
  },
};
