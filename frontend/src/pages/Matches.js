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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ECDC4]/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <NavigationBar />
        
        <div className="flex-1 p-4">
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
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => navigate(`/chat/${match.id}`)}
                  className="bg-white/80 backdrop-blur-sm border-2 border-[#E5E5E5]/50 rounded-2xl p-4 hover:shadow-xl hover:border-[#1A73E8]/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  data-testid={`match-card-${match.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-2xl font-bold">
                      {match.partner.name[0]}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1F1F1F]">
                        {match.partner.name}, {match.partner.age}
                      </h3>
                      <p className="text-[#7A7A7A] text-sm">{match.partner.city}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[#FF5757] text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{match.expires_in_days} дн.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matches;
