import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createSerpinskiTriangle from './createSerpinskiTriangle'

export const Lesson08Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/geometry')
    .setTitle('THREE.js | Serpinski Triangle')
    .setElement(<CanvasApp createApp={createSerpinskiTriangle} />)
    .showInMenu('main', 'Serpinski Triangle', 0)
}
