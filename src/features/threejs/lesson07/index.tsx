import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createFlyControlApp from './createFlyControlApp'
import createMouseControlApp from './createMouseControlApp'

export const Lesson07Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/mouse-control')
    .setTitle('THREE.js | Mouse Control')
    .setElement(<CanvasApp createApp={createMouseControlApp} />)
    .showInMenu('main', 'Mouse Control', 0)
  app
    .child()
    .setPath('/fly-control')
    .setTitle('THREE.js | Fly Control')
    .setElement(<CanvasApp createApp={createFlyControlApp} />)
    .showInMenu('main', 'Fly Control', 0)
}
