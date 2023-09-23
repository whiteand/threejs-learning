import { createContext } from 'react'
import { Vector2 } from 'three'

export const ParentSizeContext = createContext<Vector2>(new Vector2(0, 0))
