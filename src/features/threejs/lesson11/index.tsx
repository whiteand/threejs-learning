import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createTextureApp from './createTextureApp'

export const Lesson11Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/lesson-11-textures')
    .setTitle('THREE.js | Textures')
    .setElement(<CanvasApp createApp={createTextureApp} />)
    .showInMenu('main', 'Textures', 0)
}
