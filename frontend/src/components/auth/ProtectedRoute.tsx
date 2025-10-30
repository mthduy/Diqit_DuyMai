import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const refresh = useAuthStore((s) => s.refresh);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Try silent refresh when we don't have an access token
      if (!accessToken) {
        await refresh({ silent: true });
      }

      if (accessToken && !user) {
        await fetchMe({ silent: true });
      }

      if (mounted) setStarting(false);
    })();

    return () => {
      mounted = false;
    };
  }, [accessToken, user, refresh, fetchMe]);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center ">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace></Navigate>;
  }

  return <Outlet></Outlet>;
};

export default ProtectedRoute;
