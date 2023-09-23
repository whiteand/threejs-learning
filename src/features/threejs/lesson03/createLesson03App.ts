import { InteractiveApp } from '~/packages/interactive-app'

export default function createLesson03App(
  canvas: HTMLCanvasElement,
): InteractiveApp {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return {}
  }
  return {
    run() {
      ctx.fillStyle = '#336699'
      ctx.fillRect(0, 0, 100, 100)
    },
    destroy() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}
