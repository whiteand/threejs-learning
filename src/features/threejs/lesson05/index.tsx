import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createTransformationApp from './createTransformationApp'

export const Lesson05Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/transformations')
    .setTitle('THREE.js | Transformations')
    .setElement(<CanvasApp createApp={createTransformationApp} />)
    .showInMenu('main', 'Transformations', 0)
}
