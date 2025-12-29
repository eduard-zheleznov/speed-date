import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Video, MessageCircle, User, Star, Shield, HelpCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Check if user is admin via is_admin field or legacy email check
  const isAdmin = user?.is_admin || user?.is_super_admin || user?.email?.toLowerCase() === 'admin@test.com';

  const baseNavItems = [
    { icon: Video, path: '/videochat', label: 'Видеочат', testId: 'nav-videochat', color: '#FF5757' },
    { icon: MessageCircle, path: '/matches', label: 'Чаты', testId: 'nav-matches', color: '#00C896' },
    { icon: User, path: '/profile', label: 'Профиль', testId: 'nav-profile', color: '#7B61FF' },
    { icon: Star, path: '/subscriptions', label: 'Подписка', testId: 'nav-subscriptions', color: '#FFA726' }
  ];
  
  const navItems = isAdmin 
    ? [...baseNavItems, { icon: Shield, path: '/admin', label: 'Админ', testId: 'nav-admin', color: '#1A73E8' }]
    : baseNavItems;

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-lg border-b border-[#E5E5E5]/50 shadow-sm sticky top-0 z-50" data-testid="navigation-bar">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center py-2 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    relative flex flex-col items-center gap-1 min-w-[60px] px-3 py-2 rounded-xl
                    transition-all duration-300 group
                    ${isActive 
                      ? 'bg-gradient-to-br from-white to-[#F6F7F9] shadow-md scale-105' 
                      : 'hover:bg-[#F6F7F9]/50'
                    }
                  `}
                  data-testid={item.testId}
                >
                  {/* Glow effect for active */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-xl opacity-20 blur-xl transition-opacity"
                      style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className="relative">
                    <Icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive 
                          ? 'scale-110' 
                          : 'group-hover:scale-105'
                      }`}
                      style={{ color: isActive ? item.color : '#9AA0A6' }}
                    />
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <div 
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={`text-xs font-medium transition-all duration-300 ${
                      isActive 
                        ? 'font-semibold' 
                        : 'group-hover:text-[#1F1F1F]'
                    }`}
                    style={{ color: isActive ? item.color : '#9AA0A6' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
            
            {/* Feedback button */}
            <button
              onClick={() => setShowFeedback(true)}
              className="flex flex-col items-center gap-1 min-w-[60px] px-3 py-2 rounded-xl hover:bg-[#F6F7F9]/50 transition-all"
              data-testid="nav-feedback"
            >
              <HelpCircle className="w-5 h-5 text-[#9AA0A6] hover:text-[#1A73E8]" />
              <span className="text-xs font-medium text-[#9AA0A6]">Связь</span>
            </button>
          </div>
        </div>
      </nav>
      
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
};

export default NavigationBar;
