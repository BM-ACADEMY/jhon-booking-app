import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { setAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setAuthModal('login');
    navigate('/', { replace: true });
  }, [setAuthModal, navigate]);

  return null;
};

export default LoginPage;
