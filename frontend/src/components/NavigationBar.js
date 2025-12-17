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
    { icon: Video, path: '/videochat', label: 'Видеочат', testId: 'nav-videochat' },
    { icon: MessageCircle, path: '/matches', label: 'Чаты', testId: 'nav-matches' },
    { icon: User, path: '/profile', label: 'Профиль', testId: 'nav-profile' },
    { icon: Star, path: '/subscriptions', label: 'Подписка', testId: 'nav-subscriptions' }
  ];
  
  const navItems = isAdmin 
    ? [...baseNavItems, { icon: Shield, path: '/admin', label: 'Админ', testId: 'nav-admin' }]
    : baseNavItems;

  return (
    <nav className="bg-white border-b border-[#E5E5E5]" data-testid="navigation-bar">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 min-w-[60px]"
                data-testid={item.testId}
              >
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-[#1A73E8]' : 'text-[#9AA0A6]'}`}
                />
                <span className={`text-xs ${isActive ? 'text-[#1A73E8]' : 'text-[#9AA0A6]'}`}>
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
