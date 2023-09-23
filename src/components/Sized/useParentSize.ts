import { useContext } from 'react'
import { Vector2 } from 'three'
import { ParentSizeContext } from './ParentSizeContext'

export function useParentSize(): Vector2 {
  return useContext(ParentSizeContext)
}
