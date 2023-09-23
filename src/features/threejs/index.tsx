import { FeatureConstructor } from '~/architecture/types'
import Home from '~/components/layouts/Home'
import { Lesson03Feature } from '~/features/threejs/lesson03'
import { Lesson04Feature } from '~/features/threejs/lesson04'

export const ThreeJsFeature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/')
    .setElement(<Home />)
    .use(Lesson03Feature)
    .use(Lesson04Feature)
}
