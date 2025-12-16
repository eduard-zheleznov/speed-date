import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/modals/LoginModal';
import RegisterModal from '../components/modals/RegisterModal';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';

const Landing = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/videochat');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      title: 'Быстрые знакомства',
      items: ['Видео звонки в реальном времени', 'Мгновенные совпадения', 'Удобный интерфейс']
    },
    {
      title: 'Умные фильтры',
      items: ['Выбор возраста и пола', 'Фильтр по городу', 'Личные предпочтения']
    },
    {
      title: 'Безопасность',
      items: ['Проверка возраста 18+', 'Система жалоб', 'Модерация контента']
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1F1F1F] text-center mb-8" style={{ fontFamily: 'Manrope, sans-serif' }}>
          СЕРВИС БЫСТРЫХ<br />ВИДЕОСВИДАНИЙ
        </h1>
        
        <div className="flex flex-col gap-4 mb-12 w-full max-w-sm">
          <button
            onClick={() => setShowRegister(true)}
            className="w-full py-4 px-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #FF5757 0%, #FF7B7B 100%)' }}
            data-testid="register-button"
          >
            ЗАРЕГИСТРИРОВАТЬСЯ
          </button>
          
          <button
            onClick={() => setShowLogin(true)}
            className="w-full py-4 px-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
            data-testid="login-button"
          >
            ВОЙТИ
          </button>
          
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-[#7A7A7A] text-sm hover:text-[#1F1F1F] transition-colors"
            data-testid="forgot-password-link"
          >
            Забыли пароль?
          </button>
        </div>

        <div className="w-full max-w-5xl">
          <h2 className="text-2xl font-semibold text-[#1F1F1F] text-center mb-8">
            Почему выбирают наш сервис:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-[#E5E5E5] bg-white hover:shadow-lg transition-shadow"
                data-testid={`feature-card-${index}`}
              >
                <div className="text-[#1A73E8] mb-4">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1F1F1F] mb-3">{feature.title}</h3>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="text-[#7A7A7A] text-sm">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        onForgotPassword={() => {
          setShowLogin(false);
          setShowForgotPassword(true);
        }}
      />
      
      <RegisterModal 
        isOpen={showRegister} 
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
      
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => {
          setShowForgotPassword(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
};

export default Landing;
