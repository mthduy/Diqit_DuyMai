import { Button } from '../ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router';

const Logout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};

export default Logout;
