import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { MessageCircle, Clock } from 'lucide-react';
import api from '../lib/api';

const Matches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadMatches = async () => {
    try {
      const response = await api.get('/chat/matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <NavigationBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#7A7A7A]">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Navigation - always on top */}
      <NavigationBar />
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF] pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ECDC4]/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        
        <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Мои чаты
          </h1>

          {matches.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-[#9AA0A6] mx-auto mb-4" />
              <p className="text-[#7A7A7A] text-lg">У вас пока нет активных чатов</p>
              <p className="text-[#B5B5B5] text-sm mt-2">Начните знакомства, чтобы найти совпадения</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const hasUnread = match.unread_count > 0;
                const partnerPhoto = match.partner.photos?.[0];
                
                return (
                  <div
                    key={match.id}
                    onClick={() => navigate(`/chat/${match.id}`)}
                    className={`bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                      hasUnread ? 'border-[#1A73E8]/50 bg-[#1A73E8]/5' : 'border-[#E5E5E5]/50 hover:border-[#1A73E8]/50'
                    }`}
                    data-testid={`match-card-${match.id}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar with unread indicator */}
                      <div className="relative">
                        {partnerPhoto ? (
                          <img 
                            src={partnerPhoto}
                            alt={match.partner.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-2xl font-bold">
                            {match.partner.name[0]}
                          </div>
                        )}
                        
                        {/* Unread badge */}
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 bg-[#FF5757] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                            {match.unread_count > 99 ? '99+' : match.unread_count}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-lg font-semibold text-[#1F1F1F] ${hasUnread ? 'font-bold' : ''}`}>
                            {match.partner.name}, {match.partner.age}
                          </h3>
                        </div>
                        <p className="text-[#7A7A7A] text-sm truncate">{match.partner.city}</p>
                        
                        {/* Last message preview */}
                        {match.last_message && (
                          <p className={`text-sm truncate mt-1 ${hasUnread ? 'text-[#1F1F1F] font-medium' : 'text-[#7A7A7A]'}`}>
                            {match.last_message.is_own ? 'Вы: ' : ''}{match.last_message.text}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-[#FF5757] text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{match.expires_in_days} дн.</span>
                        </div>
                        {match.last_message && (
                          <p className="text-xs text-[#B5B5B5] mt-1">
                            {new Date(match.last_message.timestamp).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Matches;
