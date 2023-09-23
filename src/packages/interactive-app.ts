import { doNothing } from '~/packages/doNothing'

export interface InteractiveApp<Ctx = unknown> {
  onFrame?: (ctx: Ctx, time: DOMHighResTimeStamp) => void
  destroy?: (ctx: Ctx) => void
  run?: () => Ctx
}

export function createApp<T>(
  run: InteractiveApp<T>['run'],
  onFrame: InteractiveApp<T>['onFrame'] = doNothing,
  destroy: InteractiveApp<T>['destroy'] = doNothing,
): InteractiveApp<T> {
  return {
    run,
    onFrame,
    destroy,
  }
}

export function runApp<T>(app: InteractiveApp<T>): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ctx = undefined as any
  if (app.run) {
    ctx = app.run()
  }

  let frames = 0

  function onFrame(time: DOMHighResTimeStamp) {
    if (!app.onFrame) {
      frames = 0
      return
    }
    frames = requestAnimationFrame(onFrame)
    app.onFrame(ctx, time)
  }

  if (app.onFrame) {
    frames = requestAnimationFrame(onFrame)
  }

  return () => {
    cancelAnimationFrame(frames)
    if (app.destroy) app.destroy(ctx)
  }
}
