import { useState } from './tiny-state';

export default (props) => {
  const [state, dispatch] = useState();

  const handleChangeTheme = () => {
    dispatch({
      type: 'changeTheme',
      newTheme: {
        primary: 'red',
      },
    });
  };
  return (
    <div className="App">
      <h1>Hello React. - {state.theme.primary}</h1>
      <button onClick={handleChangeTheme}>ChangeTheme</button>
    </div>
  );
};
