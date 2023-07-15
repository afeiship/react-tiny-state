import '@jswork/next';
import '@jswork/next-slice2str';
import '@jswork/next-camelize';
import { StateProvider } from './tiny-state';
import Comp1 from './comp1';
import stores from './shared/stores';

export default function App() {
  return (
    <StateProvider store={stores}>
      <Comp1 />
    </StateProvider>
  );
}
