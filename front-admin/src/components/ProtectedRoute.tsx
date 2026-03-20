import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
