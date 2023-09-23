import { useEffect } from 'react'

export default function Title({ children: title }: { children?: string }) {
  useEffect(() => {
    if (title == null) return
    const oldTitle = document.title
    document.title = title
    return () => {
      document.title = oldTitle
    }
  }, [title])
  return null
}
