import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AiPage } from '../pages/ai/AiPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/Layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { UsersPage } from '../pages/users/UsersPage';
import { ContentPage } from '../pages/content/ContentPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'ai', element: <AiPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'content', element: <ContentPage /> },
        ],
      },
    ],
  },
]);
