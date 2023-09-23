import { useEffect, useRef } from 'react'
import Canvas from '~/components/Canvas'
import { useParentSize } from '~/components/Sized/useParentSize'

export default function Lesson03Canvas() {
  const size = useParentSize()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#336699'
    ctx.fillRect(10, 10, 10, 10)
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
