type StoreDescriptor = {
  name?: string;
  state: Record<string, any>;
  getters?: Record<string, GetterFn>;
  actions?: Record<string, ActionFn>;
  watch?: Record<string, Watcher>;
};

interface NxStatic {
  $defineStore(inName: string, inDescriptor: StoreDescriptor): StoreDescriptor;
  $get(inPath: string, inDefault?: any): any;
  $set(inPath: string, inValue: any): void;
  $call(inPath: string, inArgs?: any[]): any;
}
