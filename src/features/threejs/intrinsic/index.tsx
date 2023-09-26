import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createIntrinsicApp from './createIntrinsicApp'

export const IntrinsicFeature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/intrinsic')
    .setTitle('Intrinsic')
    .setElement(<CanvasApp createApp={createIntrinsicApp} />)
    .showInMenu('main', 'Intrinsic', 0)
}
