declare module '@jswork/react-tiny-state';

type Watcher = (newValue: any, oldValue: any) => void;
type ActionFn = (inState: any) => Promise<any> | any;
type GetterFn = (inState: any) => any;

type StoreDescriptor = {
  name?: string;
  state: Record<string, any>;
  getters?: Record<string, GetterFn>;
  actions?: Record<string, ActionFn>;
  watch?: Record<string, Watcher>;
};

type StateProviderProps = {
  store: Record<string, any>;
  children: React.ReactNode;
};

interface NxStatic {
  $defineStore(inDescriptor: StoreDescriptor): StoreDescriptor;
  $use(inPath: string, inDefault?: any): any;
  $get(inPath: string, inDefault?: any): any;
  $set(inPath: string, inValue: any): void;
  $call(inPath: string, inArgs?: any[]): any;
}
