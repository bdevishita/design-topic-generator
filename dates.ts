const p2 = (n: number) => String(n).padStart(2, "0");

export const keyOf = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const fmtDate = (k: string) => parseKey(k).toLocaleDateString("en", { day: "numeric", month: "short" });
export const fmtDateLong = (k: string) => parseKey(k).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
