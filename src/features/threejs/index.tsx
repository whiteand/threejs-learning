import { FeatureConstructor } from '~/architecture/types'
import Home from '~/components/layouts/Home'
import { Lesson03Feature } from '~/features/threejs/lesson03'
import { Lesson05Feature } from '~/features/threejs/lesson05'
import { Lesson06Feature } from '~/features/threejs/lesson06'
import { Lesson07Feature } from '~/features/threejs/lesson07'
import { Lesson08Feature } from '~/features/threejs/lesson08'
import { Lesson10Feature } from '~/features/threejs/lesson10'

export const ThreeJsFeature: FeatureConstructor = (app) => {
  app
    .child()
    .setPath('/')
    .setElement(<Home />)
    .use(Lesson03Feature)
    .use(Lesson05Feature)
    .use(Lesson06Feature)
    .use(Lesson07Feature)
    .use(Lesson08Feature)
    .use(Lesson10Feature)
}
