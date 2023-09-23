import { FeatureConstructor } from '~/architecture/types'
import Lesson03 from '~/features/threejs/lesson03/Lesson03'

export const Lesson03Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/lesson-03')
    .setTitle('THREE.js | Lesson 03')
    .setElement(<Lesson03 />)
    .showInMenu('main', 'Lesson 03', 0)
}
