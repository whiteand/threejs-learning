import { useEffect, useRef } from 'react'
import Canvas from '~/components/Canvas'
import { useParentSize$ } from '~/components/Sized/useParentSize$'
import createLesson03App from '~/features/threejs/lesson03/createLesson03App'
import { runApp } from '~/packages/interactive-app'
import { SizeText } from './SizeText'

export default function Lesson03Canvas() {
  const size$ = useParentSize$()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    return runApp(createLesson03App(canvas, size$))
  }, [canvasRef, size$])

  return (
    <div className="relative">
      <Canvas ref={canvasRef} />
      <div className="absolute right-2 top-2 text-gray-500">
        <SizeText />
      </div>
    </div>
  )
}
