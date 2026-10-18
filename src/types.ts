export type Watcher = (newValue: any, oldValue: any) => void;
export type ActionFn = (inState: any, inGetters: any, ...args: any[]) => Promise<any> | any;
export type GetterFn = (inState: any) => any;

/** 单个 store 模块描述（每个文件导出一个，传给 $defineStore） */
export type StoreModuleDef<S = any, G = any, A = any> = {
  /** 用户手动指定模块名，优先级最高 */
  name?: string;
  state: S | (() => S);
  getters?: G;
  actions?: A;
  watch?: Record<string, Watcher>;
};
