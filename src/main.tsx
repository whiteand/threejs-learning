import { Application } from '~/architecture/Application.tsx'
import { ThreeJsFeature } from '~/features/threejs'
import '~/index.scss'

new Application({ baseUrl: '/' })
  .use(ThreeJsFeature)
  .run(document.getElementById('root')!)
