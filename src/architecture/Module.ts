import { RouteObject } from 'react-router-dom'
import { IApplication, IMenuItem, IModule } from '~/architecture/types'
import { assert } from '~/packages/assert'

export class Module implements IModule {
  private baseUrl: string
  private path: string | null
  private element: JSX.Element | null
  private children: IModule[]
  private menus: Record<string, IMenuItem>
  constructor({ baseUrl }: { baseUrl: string }) {
    this.baseUrl = baseUrl
    this.path = null
    this.element = null
    this.children = []
    this.menus = {}
  }
  resolve(relativePath: string): string {
    const base = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl

    const rel = relativePath.startsWith('/')
      ? relativePath.slice(1)
      : relativePath

    return [base, rel].join('/')
  }
  use(cb: (app: IApplication) => void): this {
    cb(this)
    return this
  }
  setPath(path: string): this {
    assert(this.path == null)
    this.path = path
    return this
  }
  setElement(element: JSX.Element): this {
    assert(this.element == null)
    this.element = element
    return this
  }
  private appendChild(...children: IModule[]): this {
    this.children.push(...children)
    return this
  }
  showInMenu(menu: string, label: string, order: number): this {
    assert(this.menus[menu] == null)
    assert(this.path != null)
    this.menus[menu] = {
      path: this.resolve(this.path),
      title: label,
      order,
    }
    return this
  }
  child(): IModule {
    const child = new Module({
      baseUrl: this.path ? this.resolve(this.path) : this.baseUrl,
    })
    this.appendChild(child)
    return child
  }

  getRoutes(): RouteObject[] {
    const children = this.children.flatMap((child) => child.getRoutes())
    return [
      {
        path: this.path || undefined,
        element: this.element || undefined,
        children,
      },
    ]
  }
  getMenuItems(menu: string): IMenuItem[] {
    const childItems = this.children.flatMap((child) =>
      child.getMenuItems(menu),
    )
    const myItems = this.menus[menu] ? [this.menus[menu]] : []
    myItems.sort((a, b) => a.order - b.order)
    return [...myItems, ...childItems]
  }
}
