import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Video, MessageCircle, User, Star, Shield } from 'lucide-react';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.email?.includes('admin');

  const baseNavItems = [
    { icon: Video, path: '/videochat', label: 'Видеочат', testId: 'nav-videochat', color: '#FF5757' },
    { icon: MessageCircle, path: '/matches', label: 'Чаты', testId: 'nav-matches', color: '#4ECDC4' },
    { icon: User, path: '/profile', label: 'Профиль', testId: 'nav-profile', color: '#7B61FF' },
    { icon: Star, path: '/subscriptions', label: 'Подписка', testId: 'nav-subscriptions', color: '#FFD93D' }
  ];
  
  const navItems = isAdmin 
    ? [...baseNavItems, { icon: Shield, path: '/admin', label: 'Админ', testId: 'nav-admin', color: '#1A73E8' }]
    : baseNavItems;

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-[#E5E5E5]/50 shadow-sm sticky top-0 z-50" data-testid="navigation-bar">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center py-2 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  relative flex flex-col items-center gap-1.5 min-w-[70px] px-4 py-3 rounded-2xl
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
                    className="absolute inset-0 rounded-2xl opacity-20 blur-xl transition-opacity"
                    style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-all duration-300 ${
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
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
