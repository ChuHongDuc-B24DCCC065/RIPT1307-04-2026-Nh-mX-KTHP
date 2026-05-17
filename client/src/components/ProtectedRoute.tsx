import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  // Nếu chưa đăng nhập -> Đá về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có yêu cầu role (admin) mà user không khớp -> Đá về trang chủ
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;