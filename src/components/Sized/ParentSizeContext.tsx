import { createContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Vector2 } from 'three'

export const ParentSizeContext = createContext<BehaviorSubject<Vector2>>(
  new BehaviorSubject(new Vector2(0, 0)),
)
