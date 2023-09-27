import { RouteObject } from 'react-router-dom'

export type MenuId = string & { __menuId?: never }

export interface IMenuLink {
  title: string
  path: string
  order: number
}
export interface IMenuGroup {
  id: MenuId
  children: TMenuItem[]
  title: string
  order: number
}

export type TMenuItem = IMenuLink | IMenuGroup

export interface IApplication {
  child(): IModule
  use(cb: FeatureConstructor): this
  getMenuItems(menu: MenuId): TMenuItem[]
}

export interface IModule extends IApplication {
  setTitle(title: string): this
  getRoutes(): RouteObject[]
  getMenuItems(menu: MenuId): TMenuItem[]
  setPath(path: string): this
  setElement(element: JSX.Element): this
  showInMenu(menu: MenuId, label: string, order: number): this
  child(): IModule
}

export interface FeatureConstructor {
  (app: IApplication): void
}
