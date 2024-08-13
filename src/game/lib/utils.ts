export const mod = (n: number, m: number) => {
  return ((n % m) + m) % m;
};

export const randomInt = (max: number) => {
  return Math.floor(max * Math.random());
};
