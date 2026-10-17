// inline utils: replaced @jswork/next-camelize
export const camelize = (inStr: string): string => {
  const str = (inStr || '').replace(/[-_.]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''));
  return str[0].toLowerCase() + str.slice(1);
};

/**
 * 从模块文件路径解析出规范的模块名（支持任意目录名与多层级嵌套）
 * 规则：
 * 1. 剥离后缀和末尾的 /index
 * 2. 剥离开头的相对路径符号（如 ./、../）
 * 3. 第一个路径直接作为默认根目录剥离（无需写死 modules 或 stores，任意文件夹名均适用）
 * 4. 多级子目录通过 - 串联，经 camelize 转换为驼峰命名
 * 例如:
 * - './modules/counter.ts' -> 'counter'
 * - './m2/counter.ts' -> 'counter'
 * - './m2/member/profile.ts' -> 'member-profile' (camelize -> 'memberProfile')
 * - './m2/member/index.ts' -> 'member'
 */
export const resolveModuleNameFromPath = (path: string): string => {
  const p = path.replace(/\.[^.]+$/, '').replace(/\/index$/, '');
  let clean = p.replace(/^(\.\.\/|\.\/|\/)+/, '');
  // 兼容从项目根目录引用的全路径（如 /src/stores/modules/...）
  if (clean.startsWith('src/')) {
    clean = clean.replace(/^src\/[^/]+\//, '');
  }
  const parts = clean.split('/');
  // 第一个路径就是默认根目录，多于 1 段时剥离第一段
  if (parts.length > 1) {
    parts.shift();
  }
  return parts.join('-');
};

