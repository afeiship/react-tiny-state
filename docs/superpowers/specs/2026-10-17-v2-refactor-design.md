# react-tiny-state v2 重构设计

> 日期：2026-10-17
> 状态：已确认

## 1. 背景

`src/v2.ts` 提供了一个基于 `useSyncExternalStore` + 全局单例 store 的全新实现（约 190 行），相比旧版 `src/index.ts` 的 Context + `useReducer` 方案，无需 Provider 包裹即可在任意位置读写状态。

本次重构把 v2 实现正式替换为包的主实现：`src/index.ts` 采用 v2 逻辑，删除 `StateProvider` / Context / `useReducer`，包入口不再依赖 Provider。

## 2. 目标

- `src/index.ts` = v2 实现（修正下述已知问题后），默认导出全局 `nx`。
- 删除旧 `StateProvider`（Context + `useReducer`）实现。
- 保留全局 `nx.$defineStore / $get / $set / $call / $use / $resetStore` API，挂载方式不变（`declare var nx: any`，使用方需 `import '@jswork/next'`）。
- docs 示例、README、llms.txt、类型声明、测试全部同步更新。
- 构建/测试链路保持可用（gulp 产物结构不变：`dist/index.js` / `dist/index.esm.js` / `dist/index.d.ts`）。

## 3. 已知问题（本次修复）

1. **watch bug**：`watchEntries` 存的 path 缺模块前缀（存 `'primary'` 而实际路径是 `'theme.primary'`），watch 永不触发。修复：注册时存完整路径 `module + '.' + watchPath`。
2. **action 首参**：v2 传 `globalState`，改为传模块自身 state（`fn(modState, getters, ...args)`），与旧版 `this` 指向模块 state 的语义一致，docs 示例 `this.profile = res` 改为 `state.profile = res`。
3. **getter 读取**：v2 的 getter 只存在于注册表，无法通过 `nx.$get('user.isLogin')` 读取。增强 `$get` / `$use`：路径第二段命中 getter 时调用它（`nx.$get('user.isLogin')` 返回计算值）。
4. **action 上下文**：`nx.$call` 中 action 的 `this` 无明确指向。在 `$call` 里以模块 state 为 `this` 调用 action（`fn.call(modState, modState, getters, ...args)`），使 action 内部 `this.profile = ...` 的写法与旧版兼容。

## 4. 架构

### 模块划分

| 文件 | 职责 |
| --- | --- |
| `src/index.ts` | v2 实现：全局 store、`$defineStore` / `$get` / `$set` / `$call` / `$use` / `$resetStore`、watch、notify、默认导出 nx |
| `src/utils.ts` | 工具函数（`camelize` / `splitPath` / `getByPath` / `setByPath` / `isEqual`），删除不再使用的 `slice2str` / `invoke` |
| `src/global.d.ts` | 更新类型：删除 `StateProvider` 相关声明，保留/扩展 `StoreDescriptor` 与 `NxStatic` |

### 核心数据流

```
$defineStore(descriptor)          $set(path, value)
      │                                  │
      ▼                                  ▼
moduleRegistry(getters/actions)   globalState = setByPath(...)  ──►  watchEntries 比对旧/新值，命中则回调
      │                                  │
      ▼                                  ▼
   └──►  notify() ──► listeners ──► useSyncExternalStore 触发 re-render
```

### 关键实现点

- `globalState` 是模块级普通对象；`$set` 用不可变 `setByPath` 生成新根对象后整体替换。
- `notify()` 通知所有 `useSyncExternalStore` 订阅者。
- `$use` 内部：`useSyncExternalStore(subscribe, () => $get(path, defaultValue), () => defaultValue)`；`$get` 升级为返回新快照（模块 state + getter 计算值），保证订阅者在 getter 依赖变化时也能重渲染。
- `$resetStore` 清空全局 state 与 watchEntries 并通知。

### 新增 $resetStore（本次新增，v2 已有）

`nx.$resetStore()`：清空 `globalState` 与 watch 注册，触发通知。用于测试与模块热替换场景。

## 5. 类型声明（src/global.d.ts）

```ts
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
  $defineStore(inDescriptor: StoreDescriptor, autoName?: string): StoreDescriptor;
  $get(inPath: string, inDefault?: any): any;
  $set(inPath: string, inValue: any): void;
  $call(inPath: string, ...inArgs: any[]): any;
  $use(inPath: string, inDefault?: any): any;
  $resetStore(): void;
}
```

- 删除 `StateProviderProps` 与 `StateProvider` 相关声明。
- `NxStatic` 不导出（旧版也未导出），仅作声明文件内的内部类型约束。

## 6. 入口默认导出

```ts
// src/index.ts（沿用 v2.ts 原样，不 import @jswork/next）
declare var nx: any;   // 全局 nx，由 @jswork/next 自己挂到 globalThis

// ... 直接对 nx 挂载 $defineStore / $get / $set / $call / $use / $resetStore ...

export default nx;     // 默认导出全局 nx（运行时从全局对象解析）
```

> 说明：本包**不 import `@jswork/next`**。`@jswork/next` 的构建产物会在自身被 import 时把 `nx` 挂到 `globalThis`（`root.nx = root.nx || {...}`），使用方项目自行 `import '@jswork/next'` 触发该副作用即可。本包只做纯副作用挂载：`declare var nx: any`（类型声明）→ 给 `nx.$xxx` 赋值 → 默认导出全局 nx。全局对象属性可作为裸标识符解析，`export default nx` 运行时取到的是已挂载好的全局 nx。无需为本包在运行时新增对 `@jswork/next` 的依赖（devDependencies 保留用于测试与 docs）。

## 7. docs 更新

- `docs/src/App.tsx`：移除 `StateProvider` 包裹，改为引入 store 模块后直接渲染 `Comp1`（模块通过 `import './shared/stores'` 副作用注册）。
- `docs/src/shared/stores/index.ts`：glob 注册逻辑改为逐模块执行 `$defineStore`（导出注册函数或直接副作用），保证各模块注册。
- `docs/src/shared/stores/modules/user.ts`：action 内 `this.profile = res` 改为 `state.profile = res`；`nx.$set('user.profile', res)` 亦可。
- `docs/src/comp1.tsx`：`nx.$get` 用法不变（getter 路径已支持）；如需更新按钮演示 `$set`。
- `docs/src/main.tsx`：不变（无需 Provider）。

## 8. README / llms.txt 更新

- 移除 `StateProvider` 相关章节，改为「全局 API + `nx.$use`」用法。
- 保留模块定义 / getter / action / watch / `$get` / `$set` / `$call` / `$use` 文档，补齐 `$resetStore`。
- features 中「Based on Context + useReducer」改为「Based on `useSyncExternalStore` + 全局单例 store」。
- 新增说明：无需 Provider，`import '@jswork/next'` 即可使用全局 API。
- llms.txt 同步更新 Source / Examples / 描述段。

## 9. 测试（__tests__/index.spec.ts）

- 默认导出为 nx（`typeof fn.$defineStore === 'function'`）。
- `$defineStore` / `$get` / `$set`：基础读写、嵌套路径、默认值。
- getter：`$get('user.isLogin')` 读取计算值。
- watch：模块内字段与嵌套路径变更触发回调（含新/旧值）；修复后的模块前缀路径可正常触发。
- `$call`：action 以模块 state 为首参；`this` 指向模块 state。
- `$resetStore`：清空后 `$get` 返回默认值。
- `camelize` 测试保留；`slice2str` / `invoke` 测试随 utils 删除。
- 测试前 `import '@jswork/next'` 确保全局 nx 可用。

## 10. 非目标

- 不引入 `structuredClone` polyfill（现代浏览器/Node 均支持；如需兼容旧环境，`$defineStore` 已可用函数式 state 规避）。
- 不改动发布流程 / gulp 产物文件名。
- 不做 SSR 专项适配（`useSyncExternalStore` 本身支持 SSR，`$get`/`$set` 在无 DOM 环境仍可用）。
- 不保留旧 Provider 的向后兼容导出。
