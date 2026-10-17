// inline utils: replaced @jswork/next-camelize
export const camelize = (inStr: string): string => {
  const str = (inStr || '').replace(/[-_.]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''));
  return str[0].toLowerCase() + str.slice(1);
};
