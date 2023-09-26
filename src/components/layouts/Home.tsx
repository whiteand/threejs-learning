import { useContext, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ApplicationContext } from '~/architecture/Context'
import clsx from '~/packages/clsx'

function Sidebar() {
  const app = useContext(ApplicationContext)
  const [visible, setVisible] = useState(true)
  const sidebarRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const handleClose = () => {
    setVisible(false)
  }

  const handleOpen = () => {
    setVisible(true)
  }
  return (
    <>
      <div
        className={clsx('transition-all duration-500', {
          'w-40': visible,
          'w-5': !visible,
        })}
      />
      <aside
        ref={sidebarRef}
        className={clsx(
          'fixed bottom-0 left-0 top-0 flex flex-col items-end justify-start gap-2 overflow-x-hidden border-r border-r-gray-750 transition-all duration-500',
          {
            'w-40': visible,
            'w-5': !visible,
          },
        )}
      >
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center text-white"
          onClick={visible ? handleClose : handleOpen}
        >
          {visible ? '<' : '>'}
        </button>
        <nav
          ref={navRef}
          className={clsx(
            'flex h-full flex-col items-center justify-start gap-4 px-2 transition-opacity duration-500',
            {
              'opacity-0': !visible,
            },
          )}
        >
          {app.getMenuItems('main').map((link) => (
            <Link
              to={link.path}
              key={link.path}
              className="cursor-pointer whitespace-nowrap hover:text-white"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default function Home({ defaultPath }: { defaultPath?: string }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (pathname === '/' && defaultPath) {
      navigate(defaultPath)
      return
    }
  }, [pathname, navigate, defaultPath])

  return (
    <div className="flex min-h-screen flex-col gap-4 pr-4 pt-4">
      <header className="ml-40 mr-auto flex grow-0 flex-col gap-5 pl-4">
        <h1>Three.js Journey</h1>
      </header>
      <div className="flex min-h-0 grow items-stretch gap-4">
        <Sidebar />
        <div className="grow">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
