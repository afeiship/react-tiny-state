import { useSyncExternalStore } from 'react';
import deepEqual from 'fast-deep-equal';
import { camelize } from './utils';

import '@jswork/next';

// 单个store模块描述（每个文件导出一个，传给 $defineStore）
export type StoreModuleDef<S = any, G = any, A = any> = {
  /** 用户手动指定模块名，优先级最高 */
  name?: string;
  state: S | (() => S);
  getters?: G;
  actions?: A;
  watch?: Record<string, (newVal: any, oldVal: any) => void>;
};

type Listener = () => void;

// ========== 全局单例存储 ==========
let globalState: Record<string, any> = {};
const listeners = new Set<Listener>();

const moduleRegistry: {
  // key = 最终驼峰模块名
  getters: Record<string, Record<string, (modState: any) => any>>;
  actions: Record<string, Record<string, Function>>;
  watchEntries: Array<{ module: string; path: string; cb: (nv: any, ov: any) => void }>;
} = {
  getters: {},
  actions: {},
  watchEntries: [],
};

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getModuleGetters(modName: string) {
  const modState = globalState[modName];
  const modGetters = moduleRegistry.getters[modName] ?? {};
  const proxy: Record<string, any> = {};
  for (const key in modGetters) {
    Object.defineProperty(proxy, key, {
      get() {
        return modGetters[key](modState);
      },
      enumerable: true,
    });
  }
  return proxy;
}

/**
 * nx.$defineStore
 * @param descriptor 单个模块定义，来自独立文件
 * @param autoName 【可选】glob从文件名解析出来自动生成的名字；如果descriptor.name存在，则优先用descriptor.name
 */
nx.$defineStore = function (descriptor: StoreModuleDef, autoName?: string) {
  // 优先级：descriptor.name > autoName
  const rawName = descriptor.name ?? autoName;
  if (!rawName)
    throw new Error('$defineStore: must provide name in descriptor or pass autoName argument');

  const modRealName = camelize(rawName);

  // 初始化state，支持state为函数
  const modState = typeof descriptor.state === 'function' ? descriptor.state() : descriptor.state;
  globalState[modRealName] = structuredClone(modState);

  moduleRegistry.getters[modRealName] = descriptor.getters ?? {};
  moduleRegistry.actions[modRealName] = descriptor.actions ?? {};

  // 注册watch：path 存完整路径（module + '.' + watchPath），否则 watch 永不触发
  if (descriptor.watch) {
    for (const watchPath in descriptor.watch) {
      moduleRegistry.watchEntries.push({
        module: modRealName,
        path: modRealName + '.' + watchPath,
        cb: descriptor.watch[watchPath],
      });
    }
  }

  return descriptor;
};

nx.$get = function (path: string, defaultValue?: any) {
  const segments = path.split('.');
  // 路径第二段命中 getter 时调用它（如 'user.isLogin' 返回计算值）
  if (segments.length >= 2) {
    const [modName, second] = segments;
    const getter = moduleRegistry.getters[modName]?.[second];
    if (getter) return getter(globalState[modName]);
  }
  return nx.get(globalState, path, defaultValue);
};

nx.$set = function (path: string, value: any) {
  // nx.set 原地修改 globalState，先取变更前的值再写入
  const oldVal = nx.get(globalState, path);
  const oldWatchVals = moduleRegistry.watchEntries.map((entry) => nx.get(globalState, entry.path));

  nx.set(globalState, path, value);

  moduleRegistry.watchEntries.forEach((entry, i) => {
    const wNew = nx.get(globalState, entry.path);
    if (!deepEqual(oldWatchVals[i], wNew)) {
      entry.cb(wNew, oldWatchVals[i]);
    }
  });
  notify();
};

nx.$call = function (path: string, ...args: any[]) {
  const [modName, actionName] = path.split('.');
  const fn = moduleRegistry.actions[modName]?.[actionName];
  if (!fn) throw new Error(`action not found: ${path}`);
  const modState = globalState[modName];
  const getters = getModuleGetters(modName);
  // action 以模块自身 state 为首参，并以 modState 为 this
  return fn.call(modState, modState, getters, ...args);
};

nx.$use = function (path: string, defaultValue?: any) {
  const value = useSyncExternalStore(
    subscribe,
    () => nx.$get(path, defaultValue),
    () => defaultValue
  );
  return value;
};

nx.$resetStore = function () {
  globalState = {};
  moduleRegistry.watchEntries.length = 0;
  notify();
};

export default nx;
