import { useEffect, useState } from 'react'
import { useParentSize$ } from '~/components/Sized/useParentSize$'

export function SizeText() {
  const size$ = useParentSize$()
  const [size, setSize] = useState(size$.getValue())

  useEffect(() => {
    const sub = size$.subscribe(setSize)
    return () => {
      sub.unsubscribe()
    }
  }, [size$, setSize])
  return (
    <>
      {size.x}x{size.y}
    </>
  )
}
