export default () => {
  const state = nx.$get('theme');
  const profile = nx.$get('user.profile');
  const handleChangeTheme = () => {
    console.log('change theme/state: ', state);
  };


  return (
    <div className="App">
      <h1>Hello React. - {state.primary}</h1>
      <h3>isLOGIN:: {String(nx.$get('user.isLogin'))}</h3>
      <pre>
        <code>{JSON.stringify(profile, null, 2)}</code>
      </pre>

      <h4>username: {nx.$get('user.profile.login')}</h4>
      <button onClick={handleChangeTheme}>ChangeTheme</button>
    </div>
  );
};
