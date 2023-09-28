import { fromEvent, interval, take, takeUntil } from 'rxjs'
import Stats from 'stats.js'
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

  const stats = new Stats()
  stats.showPanel(1)
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
  stats.dom.style.right = '0px'
  stats.dom.style.bottom = '0px'
  stats.dom.style.left = 'auto'
  stats.dom.style.top = 'auto'

  let frames = 0

  const click$ = fromEvent(window, 'click').pipe(take(1))

  const sub = interval(60000)
    .pipe(take(1), takeUntil(click$))
    .subscribe(() => {
      // Reload window
      window.location.reload()
    })

  function onFrame(time: DOMHighResTimeStamp) {
    if (!app.onFrame) {
      frames = 0
      return
    }
    frames = requestAnimationFrame(onFrame)
    stats.begin()
    app.onFrame(ctx, time)
    stats.end()
  }

  if (app.onFrame) {
    frames = requestAnimationFrame(onFrame)
  }

  return () => {
    document.body.removeChild(stats.dom)
    cancelAnimationFrame(frames)
    sub.unsubscribe()
    if (app.destroy) app.destroy(ctx)
  }
}
