// inline utils: replaced @jswork/next-camelize
export const camelize = (inStr: string): string => {
  const str = (inStr || '').replace(/[-_.]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''));
  return str[0].toLowerCase() + str.slice(1);
};

export const splitPath = (path: string): string[] => path.split('.');

export const getByPath = (obj: unknown, path: string, defaultValue?: unknown): any => {
  const segments = splitPath(path);
  let res: any = obj;
  for (const seg of segments) {
    if (res == null) return defaultValue;
    res = res[seg];
  }
  return res ?? defaultValue;
};

export const setByPath = (obj: unknown, path: string, value: any): any => {
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
};

export const isEqual = (a: any, b: any): boolean => {
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
};
