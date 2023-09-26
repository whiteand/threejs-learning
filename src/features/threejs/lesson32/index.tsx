import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createEffectApp from './createEffectApp'

export const Lesson32PostProcessingFeature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/lesson-32-effects')
    .setTitle('THREE.js | Effects')
    .setElement(<CanvasApp createApp={createEffectApp} />)
    .showInMenu('main', 'Effects', 0)
}
