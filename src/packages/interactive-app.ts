export interface InteractiveApp {
  onFrame?: FrameRequestCallback
  destroy?: () => void
  run?: () => void
}

export function runApp(app: InteractiveApp): () => void {
  if (app.run) {
    app.run()
  }

  let frames = 0

  function onFrame(time: DOMHighResTimeStamp) {
    if (!app.onFrame) {
      frames = 0
      return
    }
    frames = requestAnimationFrame(onFrame)
    app.onFrame(time)
  }

  if (app.onFrame) {
    frames = requestAnimationFrame(onFrame)
  }

  return () => {
    cancelAnimationFrame(frames)
    if (app.destroy) app.destroy()
  }
}
