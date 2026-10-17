import '@jswork/next';
import StateProvider from '@jswork/react-tiny-state';
import Comp1 from './comp1';
import stores from './shared/stores';

export default function App() {
  return (
    <StateProvider store={stores}>
      <Comp1 />
    </StateProvider>
  );
}
