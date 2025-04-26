import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import QuizPage from './components/QuizPage'
import ProfilePage from './components/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'
import { UserProvider } from './contexts/UserContext'
import AdminPanel from './components/AdminPanel'

// URL监听组件，用于捕获并清除所有查询参数
function URLInterceptor() {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // 检查URL中是否有查询参数
    const queryParams = new URLSearchParams(location.search);
    
    // 如果存在正在导致问题的查询参数，清除它，避免浏览器重定向
    if (queryParams.has('correctAnswer') || (location.pathname === '/admin' && queryParams.toString())) {
      console.log('拦截到问题URL参数，正在清理:', location.search);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // 阻止默认的页面刷新行为
      const originalSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function() {
        console.log('拦截到表单提交尝试，已阻止');
        return false;
      };
      
      // 5秒后恢复原始函数，避免长期影响
      setTimeout(() => {
        HTMLFormElement.prototype.submit = originalSubmit;
      }, 5000);
    }
  }, [location, navigate]);
  
  return null;
}

function App() {
  return (
    <UserProvider>
      <Router>
        <URLInterceptor />
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
                <AdminPanel />
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
