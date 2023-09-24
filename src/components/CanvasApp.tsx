import { useLayoutEffect, useRef } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Vector2 } from 'three'
import Canvas from '~/components/Canvas'
import Sized from '~/components/Sized'
import { useParentSize$ } from '~/components/Sized/useParentSize$'
import { SizeText } from '~/components/SizeText'
import { InteractiveApp, runApp } from '~/packages/interactive-app'

function RunApp<T>({
  createApp,
}: {
  createApp: (
    canvas: HTMLCanvasElement,
    size$: BehaviorSubject<Vector2>,
  ) => InteractiveApp<T>
}) {
  const size$ = useParentSize$()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    return runApp(createApp(canvas, size$))
  }, [canvasRef, size$, createApp])

  return (
    <div className="relative">
      <Canvas ref={canvasRef} />
      <div className="absolute right-2 top-2 text-gray-500">
        <SizeText />
      </div>
    </div>
  )
}

export default function CanvasApp<T>({
  createApp,
}: {
  createApp: (
    canvas: HTMLCanvasElement,
    size$: BehaviorSubject<Vector2>,
  ) => InteractiveApp<T>
}) {
  return (
    <Sized className="h-full w-full">
      <RunApp createApp={createApp} />
    </Sized>
  )
}
