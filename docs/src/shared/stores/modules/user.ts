export default nx.$defineStore('user', {
  state: {
    profile: null,
    session: null,
  },
  actions: {
    hello() {
      console.log('i am user');
    },
    async profile({ username }) {
      const res = await fetch(`https://api.github.com/users/${username}`).then((r) => r.json());
      // console.log(res, this);
      this.profile = res;
      // nx.$set('profile', res);
    },
  },
  watch: {
    session(newValue) {
      console.log('session change: ', newValue);
    },
  },
});
