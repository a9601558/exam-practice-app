import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import QuizPage from './components/QuizPage'
import ProfilePage from './components/ProfilePage'
import AdminPage from './components/AdminPage'
import ProtectedRoute from './components/ProtectedRoute'
import { UserProvider } from './contexts/UserContext'

function App() {
  return (
    <UserProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
          </Routes>
        </Layout>
      </Router>
    </UserProvider>
  )
}

export default App
