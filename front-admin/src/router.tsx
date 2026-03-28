import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'
import MainLayout from './components/MainLayout'
import LoginPage from './features/login/LoginPage'
import UsersPage from './features/user/UsersPage'
import DbConnPage from './features/dbconn/DbConnPage'
import DbSqlPage from './features/dbsql/DbSqlPage'
import DbUserPage from './features/dbuser/DbUserPage'
import ReportsPage from './features/reports/ReportsPage'

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

const dbUserRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/dbconn/$dbKey/users',
  component: DbUserPage,
  loader: ({ params }) => ({ dbKey: params.dbKey }),
})

const dbSqlRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/dbsql',
  component: DbSqlPage,
})

const reportsRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: '/reports',
  component: ReportsPage,
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
  ]),
  catchAllRoute,
])

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => <div>404</div>,
})

// типизация
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { dbUserRoute, dbConnRoute, usersRoute, dbSqlRoute, reportsRoute, loginRoute }
