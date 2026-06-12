import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const { setAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthModal('register');
    navigate('/', { replace: true });
  }, [setAuthModal, navigate]);

  return null;
};

export default SignupPage;
