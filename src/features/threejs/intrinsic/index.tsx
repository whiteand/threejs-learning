import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createCubesByPathAnimation from './createCubesByPathAnimation'
import createPostProcessingAnimation from './createPostProcessingAnimation'
import createShaderMaterialApp from './createShaderMaterialApp'

export const IntrinsicFeature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/intrinsic')
    .setTitle('Intrinsic')
    .setElement(<CanvasApp createApp={createCubesByPathAnimation} />)
    .showInMenu('main', 'Intrinsic 1 | Cube', 0)
  app
    .child()
    .setPath('/intrinsic-2')
    .setTitle('Intrinsic 2')
    .setElement(<CanvasApp createApp={createPostProcessingAnimation} />)
    .showInMenu('main', 'Intrinsic 2 | Postprocessing', 0)
  app
    .child()
    .setPath('/intrinsic-3')
    .setTitle('Intrinsic 3')
    .setElement(<CanvasApp createApp={createShaderMaterialApp} />)
    .showInMenu('main', 'Intrinsic 3 | Shader', 0)
}
