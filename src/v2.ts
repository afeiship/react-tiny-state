import { useSyncExternalStore } from 'react';

declare var nx: any;

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

// ---- utils 复原原版工具 ----
function camelize(inStr: string): string {
  const str = (inStr || '').replace(/[-_.]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''));
  return str[0].toLowerCase() + str.slice(1);
}

function splitPath(path: string): string[] {
  return path.split('.');
}

function getByPath(obj: unknown, path: string, defaultValue?: unknown): any {
  const segments = splitPath(path);
  let res: any = obj;
  for (const seg of segments) {
    if (res == null) return defaultValue;
    res = res[seg];
  }
  return res ?? defaultValue;
}

function setByPath(obj: unknown, path: string, value: any): any {
  const segments = splitPath(path);
  function update(target: any, idx: number): any {
    const seg = segments[idx];
    if (idx === segments.length - 1) {
      return { ...target, [seg]: value };
    }
    return {
      ...target,
      [seg]: update(target?.[seg] ?? {}, idx + 1),
    };
  }
  return update(obj, 0);
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!keysB.includes(k) || !isEqual(a[k], b[k])) return false;
    }
  }
  return false;
}

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

  // 注册watch
  if (descriptor.watch) {
    for (const watchPath in descriptor.watch) {
      moduleRegistry.watchEntries.push({
        module: modRealName,
        path: watchPath,
        cb: descriptor.watch[watchPath],
      });
    }
  }

  return descriptor;
};

nx.$get = function (path: string, defaultValue?: any) {
  return getByPath(globalState, path, defaultValue);
};

nx.$set = function (path: string, value: any) {
  const oldState = globalState;
  const oldVal = getByPath(oldState, path);

  globalState = setByPath(globalState, path, value);
  const newVal = getByPath(globalState, path);

  for (const entry of moduleRegistry.watchEntries) {
    const wOld = getByPath(oldState, entry.path);
    const wNew = getByPath(globalState, entry.path);
    if (!isEqual(wOld, wNew)) {
      entry.cb(wNew, wOld);
    }
  }
  notify();
};

nx.$call = function (path: string, ...args: any[]) {
  const [modName, actionName] = splitPath(path);
  const fn = moduleRegistry.actions[modName]?.[actionName];
  if (!fn) throw new Error(`action not found: ${path}`);
  const getters = getModuleGetters(modName);
  return fn(globalState, getters, ...args);
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
