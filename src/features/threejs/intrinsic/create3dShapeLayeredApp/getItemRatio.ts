export function getItemRatio(len: number, ind: number): number {
  if (len <= 1) return 0
  return ind / (len - 1)
}
