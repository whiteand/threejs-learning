export function assert<T>(
  condition: T,
  message: string = 'assertion failed',
): asserts condition {
  if (condition) return

  throw new Error(message)
}
