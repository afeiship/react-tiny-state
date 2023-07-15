export default nx.$defineStore('user', {
  state: {
    profile: null,
    session: null,
  },
  getters: {
    isLogin(state: any) {
      return !!nx.get(state, 'profile.login');
    },
  },
  actions: {
    hello() {
      console.log('i am user');
    },
    async profile({ username }: any) {
      const res = await fetch(`https://api.github.com/users/${username}`).then((r) => r.json());
      // console.log(res, this);
      this.profile = res;
      // nx.$set('profile', res);
    },
  },
  watch: {
    session(newValue: any) {
      console.log('session change: ', newValue);
    },
  },
});
