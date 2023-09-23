import { RouteObject } from 'react-router-dom'

export interface IApplication {
  child(): IModule
  use(cb: FeatureConstructor): this
  getMenuItems(menu: string): IMenuItem[]
}

export interface IModule extends IApplication {
  getRoutes(): RouteObject[]
  getMenuItems(menu: string): IMenuItem[]
  setPath(path: string): this
  setElement(element: JSX.Element): this
  showInMenu(menu: string, label: string, order: number): this
  child(): IModule
}

export interface IMenuItem {
  title: string
  path: string
  order: number
}

export interface FeatureConstructor {
  (app: IApplication): void
}
