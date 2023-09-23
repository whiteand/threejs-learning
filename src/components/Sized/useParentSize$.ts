import { useContext } from 'react'
import { BehaviorSubject } from 'rxjs'
import { Vector2 } from 'three'
import { ParentSizeContext } from './ParentSizeContext'

export function useParentSize$(): BehaviorSubject<Vector2> {
  return useContext(ParentSizeContext)
}
