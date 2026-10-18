import { useSyncExternalStore } from 'react';
import deepEqual from 'fast-deep-equal';
import { camelize, resolveModuleNameFromPath } from './utils';
import type { StoreModuleDef } from './types';

import '@jswork/next';

declare global {
  interface NxStatic {
    $defineStore(inDescriptor: StoreModuleDef, inAutoName?: string): StoreModuleDef;
    $registerStores(inModules: Record<string, any>): Record<string, StoreModuleDef>;
    $get(inPath?: string, inDefault?: any): any;
    $set(inPath: string, inValue: any): void;
    $call(inPath: string, ...inArgs: any[]): any;
    $use(inPath: string, inDefault?: any): any;
    $resetStore(): void;
  }
}

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

function registerModule(rawName: string, descriptor: StoreModuleDef) {
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
}

/**
 * nx.$defineStore
 * 接收单一对象参数 descriptor：
 * - 传了 name: nx.$defineStore({ name: 'counter', state: ... }) -> 立即以该 name 注册模块
 * - 未传 name: nx.$defineStore({ state: ... }) -> name 可选，返回描述符由 $registerStores 统一注册
 * 同时向后兼容第二个 autoName 参数（例如测试或特定手动注册调用）
 */
nx.$defineStore = function (descriptor: StoreModuleDef, autoName?: string) {
  const finalName = descriptor.name ?? autoName;
  if (finalName) {
    registerModule(finalName, descriptor);
  }
  return descriptor;
};

/**
 * nx.$registerStores
 * @param modules import.meta.glob 导入的模块集合（形如 { './modules/theme.ts': descriptor }）
 * 支持单层或多层目录嵌套，自动生成命名（优先使用 descriptor.name）并完成注册
 */
nx.$registerStores = function (modules: Record<string, any>) {
  const result: Record<string, StoreModuleDef> = {};
  for (const path in modules) {
    const rawName = resolveModuleNameFromPath(path);
    const descriptor = modules[path]?.default ?? modules[path];
    if (rawName && descriptor) {
      const finalName = descriptor.name ?? rawName;
      registerModule(finalName, descriptor);
      result[finalName] = descriptor;
    }
  }
  return result;
};

nx.$get = function (path?: string, defaultValue?: any) {
  // 不传 path 返回整个 store
  if (!path) return globalState;
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
export type { StoreModuleDef, Watcher, ActionFn, GetterFn } from './types';
