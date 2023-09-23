import libClsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function clsx(...params: Parameters<typeof libClsx>): string {
  return twMerge(libClsx(...params))
}
