import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import { ApplicationContext } from '~/architecture/Context'
import { Module } from './Module'
import { IApplication, IModule, TMenuItem } from './types'

export class Application implements IApplication {
  private modules: IModule[]
  private readonly baseUrl: string
  constructor({ baseUrl }: { baseUrl: string }) {
    this.modules = []
    this.baseUrl = baseUrl
  }
  child(): Module {
    const mod = new Module({
      baseUrl: this.baseUrl,
    })
    this.modules.push(mod)
    return mod
  }
  use(cb: (app: IApplication) => void): this {
    cb(this)
    return this
  }

  private getRoutes(): RouteObject[] {
    const routes = []
    for (const mod of this.modules) {
      routes.push(...mod.getRoutes())
    }
    return routes
  }

  private createRouter() {
    return createBrowserRouter(this.getRoutes())
  }

  getMenuItems(menu: string) {
    const items: TMenuItem[] = []
    for (const mod of this.modules) {
      items.push(...mod.getMenuItems(menu))
    }
    items.sort((a, b) => a.order - b.order)
    return items
  }

  run(dom: HTMLElement) {
    ReactDOM.createRoot(dom).render(
      <React.StrictMode>
        <ApplicationContext.Provider value={this}>
          <RouterProvider router={this.createRouter()} />
        </ApplicationContext.Provider>
      </React.StrictMode>,
    )
  }
}
