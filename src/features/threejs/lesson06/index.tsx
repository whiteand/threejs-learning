import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createLesson06App from './createLesson06App'

export const Lesson06Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/lesson06')
    .setTitle('THREE.js | Lesson 05')
    .setElement(<CanvasApp createApp={createLesson06App} />)
    .showInMenu('main', 'Lesson 05', 0)
}
