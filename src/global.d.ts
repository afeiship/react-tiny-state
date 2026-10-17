declare module '@jswork/react-tiny-state';

type Watcher = (newValue: any, oldValue: any) => void;
type ActionFn = (inState: any, inGetters: any, ...args: any[]) => Promise<any> | any;
type GetterFn = (inState: any) => any;

type StoreDescriptor = {
  name?: string;
  state: Record<string, any> | (() => Record<string, any>);
  getters?: Record<string, GetterFn>;
  actions?: Record<string, ActionFn>;
  watch?: Record<string, Watcher>;
};

interface NxStatic {
  $defineStore(inDescriptor: StoreDescriptor): StoreDescriptor;
  $registerStores(inModules: Record<string, any>): Record<string, StoreDescriptor>;
  $get(inPath?: string, inDefault?: any): any;
  $set(inPath: string, inValue: any): void;
  $call(inPath: string, ...inArgs: any[]): any;
  $use(inPath: string, inDefault?: any): any;
  $resetStore(): void;
}
