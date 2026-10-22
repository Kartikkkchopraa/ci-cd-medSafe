import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import Login from './pages/Login'
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SearchAndSelect from './pages/SearchAndSelect'
import Result from './pages/Result'

const App = () => {

  useEffect(() => {
    useAuthStore.getState().restoreSession()
  }, [])

  return (

    <BrowserRouter>
      <Routes>
        <Route path='/' element={
          <LandingPage/>
        } />
        <Route element={<PublicOnlyRoute />}>
          <Route path='/register' element={
            <Register/>
          } />
          <Route path='/login' element={
            <Login/>
          } />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path='/search' element={
            <SearchAndSelect/>
          } />
          <Route path='/dashboard' element={<Navigate to='/search' replace />} />
          <Route path='/results' element={
            <Result/>
          } />
        </Route>
      </Routes>

    </BrowserRouter>

  )
}

export default App
