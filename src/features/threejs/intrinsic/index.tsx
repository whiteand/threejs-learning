import { FeatureConstructor } from '~/architecture/types'
import CanvasApp from '~/components/CanvasApp'
import createIntrinsicApp from './createIntrinsicApp'
import createIntrinsicApp2 from './createIntrinsicApp2'

export const IntrinsicFeature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/intrinsic')
    .setTitle('Intrinsic')
    .setElement(<CanvasApp createApp={createIntrinsicApp} />)
    .showInMenu('main', 'Intrinsic', 0)
  app
    .child()
    .setPath('/intrinsic-2')
    .setTitle('Intrinsic 2')
    .setElement(<CanvasApp createApp={createIntrinsicApp2} />)
    .showInMenu('main', 'Intrinsic 2', 0)
}
