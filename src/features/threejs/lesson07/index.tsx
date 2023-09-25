import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createMouseControlApp from './createMouseControlApp'

export const Lesson07Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/mouse-control')
    .setTitle('THREE.js | Mouse Control')
    .setElement(<CanvasApp createApp={createMouseControlApp} />)
    .showInMenu('main', 'Mouse Control', 0)
}
