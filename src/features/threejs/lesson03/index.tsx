import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createUkrainianFlagApp from './createUkrainianFlagApp'

export const Lesson03Feature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/ukrainian-flag')
    .setTitle('THREE.js | Ukrainian Flag')
    .setElement(<CanvasApp createApp={createUkrainianFlagApp} />)
    .showInMenu('main', 'Ukrainian Flag', 0)
}
