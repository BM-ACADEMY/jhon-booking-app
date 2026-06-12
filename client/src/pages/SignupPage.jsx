import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const { setAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setAuthModal('register');
    const from = location.state?.from || '/';
    if (from !== '/') {
      sessionStorage.setItem('redirect_after_login', from);
    }
    navigate('/', { replace: true });
  }, [setAuthModal, navigate, location]);

  return null;
};

export default SignupPage;
