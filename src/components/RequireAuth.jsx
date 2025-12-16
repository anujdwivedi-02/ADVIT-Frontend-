import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../authContext/AuthProvider'

const RequireAuth = ({ children }) => {
  const { user, loading } = useContext(AuthContext)
  const location = useLocation()

  if (loading) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export default RequireAuth
