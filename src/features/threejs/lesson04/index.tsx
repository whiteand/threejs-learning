import { FeatureConstructor } from '~/architecture/types'

export const Lesson04Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/lesson-04')
    .setElement(<div>Lesson 04</div>)
    .showInMenu('main', 'Lesson 04', 1)
}
