import { useEffect, useRef } from 'react'
import Canvas from '~/components/Canvas'
import { useParentSize } from '~/components/Sized/useParentSize'
import createLesson03App from '~/features/threejs/lesson03/createLesson03App'
import { runApp } from '~/packages/interactive-app'

export default function Lesson03Canvas() {
  const size = useParentSize()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    return runApp(createLesson03App(canvas))
  }, [canvasRef])

  return (
    <div className="relative">
      <Canvas ref={canvasRef} width={size.x} height={size.y} />
      <div className="absolute right-2 top-2 text-gray-500">
        {size.x}x{size.y}
      </div>
    </div>
  )
}
