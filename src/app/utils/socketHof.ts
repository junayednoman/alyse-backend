
export const socketHof = (fn: any, data: any) => {
  if (typeof fn === 'function') {
    fn(data);
  }
  return;
};