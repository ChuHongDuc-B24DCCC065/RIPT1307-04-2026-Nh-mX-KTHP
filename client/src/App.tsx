import React from 'react';
import { Layout, Menu, ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';

import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateQuestion from './pages/CreateQuestion';
import QuestionDetail from './pages/QuestionDetail';
import UserProfile from './pages/UserProfile';
import EditQuestion from './pages/EditQuestion';
const { Header, Content } = Layout;

const App: React.FC = () => {
  const userData = localStorage.getItem('user');
  const parsedUser = userData ? JSON.parse(userData) : null;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/welcome';
  };

  // Menu items linh hoạt
  const navItems = [
    {
      key: parsedUser ? '/' : '/welcome',
      label: <Link to={parsedUser ? '/' : '/welcome'}>Trang chủ</Link>,
    },
    // Nếu là admin thì hiện thêm nút quản trị trên menu cho dễ vào
    ...(parsedUser?.role === 'admin' ? [{
      key: '/admin',
      label: <Link to="/admin">Quản trị</Link>,
    }] : []),
    ...(parsedUser ? [
      {
        key: '/profile',
        label: <Link to="/profile">Hồ sơ cá nhân</Link>,
      },
      {
        key: 'logout',
        label: <span onClick={handleLogout} style={{ color: '#ff4d4f' }}>Đăng xuất</span>,
      }
    ] : [
      {
        key: '/login',
        label: <Link to="/login">Đăng nhập</Link>,
      }
    ])
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
      }}
    >
      <Router>
        <Layout className="layout" style={{ height: '100vh', overflow: 'hidden', background: '#f0f2f5' }}>
          <Header style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
            padding: '0 50px',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <div className="logo" style={{ color: 'white', fontSize: '24px', fontWeight: '800', marginRight: '40px', letterSpacing: '1px' }}>
              SV<span style={{ color: '#00d2ff' }}>FORUM</span>
            </div>
            <Menu theme="dark" mode="horizontal" items={navItems} style={{ flex: 1, background: 'transparent', borderBottom: 'none' }} />
          </Header>
          
          <Content style={{ padding: '24px 50px', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              background: '#fff', 
              padding: 24, 
              flex: 1, 
              borderRadius: '16px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Routes>
                <Route path="/" element={<HomePage />} />   
                <Route path="/welcome" element={<LandingPage />} /> 
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/create-question" element={<CreateQuestion />} />
                <Route path="/questions/:id" element={<QuestionDetail />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/edit-question/:id" element={<EditQuestion />} />
                
                {/* Bọc trang Admin bằng ProtectedRoute */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};
export default App;