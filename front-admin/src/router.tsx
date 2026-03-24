import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import MainLayout from './components/MainLayout'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import DbConnPage from './pages/DbConnPage'
import DbSqlPage from './pages/DbSqlPage'
import DbUserPage from './features/dbuser/DbUserPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

const isLoggedIn = () => !!sessionStorage.getItem('isLoggedIn')

const rootRoute = createRootRoute()

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: '/login' })
  },
  component: MainLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/users' })
  },
})

const usersRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/users',
  component: UsersPage,
})

const dbConnRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/dbconn',
  component: DbConnPage,
})

const dbSqlRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/dbsql',
  component: DbSqlPage,
})

const dbUserRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/dbuser/$dbKey',
  component: DbUserPage,
  loader: async ({ params }) => {
    return { dbKey: params.dbKey }
  },
})

const reportsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/reports',
  component: ReportsPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/settings',
  component: SettingsPage,
})

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedLayout.addChildren([
    indexRoute,
    usersRoute,
    dbConnRoute,
    dbSqlRoute,
    dbUserRoute,
    reportsRoute,
    settingsRoute,
  ]),
  catchAllRoute,
])

export const router = createRouter({ routeTree })

// типизация
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { dbUserRoute, dbConnRoute, usersRoute, dbSqlRoute, reportsRoute, settingsRoute, loginRoute }
