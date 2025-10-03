import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requiresAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user }:any = useAuth(); // Ensure user contains `isAdmin`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiresAdmin && !user?.isAdmin) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
