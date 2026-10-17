import nx from '@jswork/next';

// inline utils: replaced @jswork/next-slice2str / next-camelize / next-invoke
export const camelize = (inStr: string): string => {
  const str = (inStr || '').replace(/[-_.]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''));
  return str[0].toLowerCase() + str.slice(1);
};

export const slice2str = (inString: string, inTarget: string | number, inStep?: number) => {
  const isSeparator = typeof inTarget === 'string';
  const idx = (isSeparator ? inString.indexOf(inTarget as string) : inTarget) as number;
  const defaultStep = isSeparator ? 1 : 0;
  const step = typeof inStep === 'undefined' ? defaultStep : inStep;
  if (!inString && inString.length <= idx) return;
  return [inString.substr(0, idx), inString.substring(idx + step)];
};

export const invoke = (inContext: any, inPath: any, ...inArgs: any[]) => {
  const method = typeof inPath === 'function' ? inPath : nx.get(inContext, inPath);
  const args = Array.isArray(inArgs[0]) ? inArgs[0] : inArgs;
  if (typeof method === 'function') return method.apply(inContext, args);
};
