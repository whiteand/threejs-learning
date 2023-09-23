import { HTMLAttributes, useLayoutEffect, useRef, useState } from 'react'
import { Vector2 } from 'three'
import clsx from '~/packages/clsx'
import { ParentSizeContext } from './ParentSizeContext'

export default function Sized({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [size, setSize] = useState<Vector2>(new Vector2(0, 0))
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [sized, setSized] = useState(false)

  useLayoutEffect(() => {
    let lastSize: Pick<DOMRect, 'width' | 'height'> = { width: 0, height: 0 }
    let sized = false
    const handleResize = () => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const { width, height } = rect
      if (lastSize.width === width && lastSize.height === height) return
      lastSize = rect
      setSize(new Vector2(width, height))
      if (!sized) {
        setSized(true)
        sized = true
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    const interval = setInterval(handleResize, 1000)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [setSize, setSized])
  return (
    <div
      ref={wrapperRef}
      className={clsx('relative h-full w-full overflow-hidden', className)}
      {...props}
    >
      <div className="absolute left-0 top-0 h-full w-full">
        <ParentSizeContext.Provider value={size}>
          {sized ? children : null}
        </ParentSizeContext.Provider>
      </div>
    </div>
  )
}
