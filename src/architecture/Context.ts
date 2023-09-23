import { createContext } from 'react'
import { IApplication } from '~/architecture/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ApplicationContext = createContext<IApplication>(null as any)
