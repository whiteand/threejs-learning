import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createControlsApp from './createControlsApp'

export const Lesson10Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/lil-gui-controls')
    .setTitle('THREE.js | Controls via lil-gui')
    .setElement(<CanvasApp createApp={createControlsApp} />)
    .showInMenu('main', 'Controls via lil-gui', 0)
}
