import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/modals/LoginModal';
import RegisterModal from '../components/modals/RegisterModal';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';
import { Video, Users, Shield, Heart, MessageCircle, Lock } from 'lucide-react';

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
      icon: Video,
      title: 'Быстрые знакомства',
      items: ['Видео звонки в реальном времени', 'Мгновенные совпадения', 'Удобный интерфейс'],
      gradient: 'from-[#FF6B6B] to-[#FF8E8E]'
    },
    {
      icon: Users,
      title: 'Умные фильтры',
      items: ['Выбор возраста и пола', 'Фильтр по городу', 'Личные предпочтения'],
      gradient: 'from-[#4ECDC4] to-[#44A19B]'
    },
    {
      icon: Shield,
      title: 'Безопасность',
      items: ['Проверка возраста 18+', 'Система жалоб', 'Модерация контента'],
      gradient: 'from-[#FFD93D] to-[#F5C042]'
    }
  ];

  const floatingShapes = [
    { icon: Heart, delay: 0, duration: 20 },
    { icon: MessageCircle, delay: 5, duration: 25 },
    { icon: Video, delay: 10, duration: 22 },
    { icon: Users, delay: 3, duration: 18 }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF]">
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-[#1A73E8]/10 to-[#E056FD]/10"
              style={{
                width: `${Math.random() * 300 + 50}px`,
                height: `${Math.random() * 300 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Icons */}
      {floatingShapes.map((shape, index) => {
        const IconComponent = shape.icon;
        return (
          <div
            key={index}
            className="absolute opacity-10"
            style={{
              left: `${(index * 25) % 100}%`,
              animation: `floatUpDown ${shape.duration}s ease-in-out infinite`,
              animationDelay: `${shape.delay}s`
            }}
          >
            <IconComponent className="w-16 h-16 text-[#1A73E8]" />
          </div>
        );
      })}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 animate-fadeIn">
        {/* Logo/Title with animation */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1A73E8] to-[#7B61FF] flex items-center justify-center shadow-2xl animate-pulse">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-4 animate-slideUp" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <span className="bg-gradient-to-r from-[#1A73E8] via-[#7B61FF] to-[#E056FD] text-transparent bg-clip-text">
              СЕРВИС БЫСТРЫХ
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#E056FD] via-[#7B61FF] to-[#1A73E8] text-transparent bg-clip-text">
              ВИДЕОСВИДАНИЙ
            </span>
          </h1>
          
          <p className="text-center text-[#7A7A7A] text-lg max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            Знакомьтесь через видеочат.<br />Быстро, безопасно, удобно.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 mb-16 w-full max-w-sm animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={() => setShowRegister(true)}
            className="group relative w-full py-5 px-8 rounded-full font-semibold text-lg text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FF5757 0%, #FF8E8E 100%)' }}
            data-testid="register-button"
          >
            <span className="relative z-10">ЗАРЕГИСТРИРОВАТЬСЯ</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>
          
          <button
            onClick={() => setShowLogin(true)}
            className="group relative w-full py-5 px-8 rounded-full font-semibold text-lg text-white overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
            data-testid="login-button"
          >
            <span className="relative z-10">ВОЙТИ</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>
          
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-[#1A73E8] text-sm hover:text-[#1F1F1F] transition-colors font-medium"
            data-testid="forgot-password-link"
          >
            Забыли пароль?
          </button>
        </div>

        <div className="w-full max-w-6xl animate-fadeIn" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-3xl font-semibold text-center mb-12 bg-gradient-to-r from-[#1F1F1F] to-[#7A7A7A] text-transparent bg-clip-text">
            Почему выбирают наш сервис:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-[#E5E5E5] hover:border-[#1A73E8] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeInUp"
                  style={{ animationDelay: `${0.8 + index * 0.2}s` }}
                  data-testid={`feature-card-${index}`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#1F1F1F] mb-4 group-hover:text-[#1A73E8] transition-colors">
                    {feature.title}
                  </h3>
                  
                  <ul className="space-y-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#7A7A7A]">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#34C759] to-[#5DD97C] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-16 flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 backdrop-blur-sm border border-[#E5E5E5] animate-fadeIn" style={{ animationDelay: '1.2s' }}>
          <Lock className="w-5 h-5 text-[#34C759]" />
          <span className="text-sm text-[#7A7A7A]">Безопасный сервис · Проверка 18+ · Конфиденциальность</span>
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

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideDown {
          animation: slideDown 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Landing;
