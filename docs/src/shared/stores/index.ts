const moduleFiles = import.meta.glob('./modules/*.ts', { eager: true });
const stores: Record<string, any> = {};

for (const path in moduleFiles) {
  const name = path.replace(/^\.\/modules\/(.*)\.\w+$/, '$1');
  const moduleObj = moduleFiles[path] as any;
  const useStoreFn = moduleObj.default;
  stores[name] = useStoreFn;
}

export default stores;
