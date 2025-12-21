import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import VideoChatSimulator from '../components/VideoChatSimulator';
import DecisionModal from '../components/modals/DecisionModal';
import FilterModal from '../components/modals/FilterModal';
import ComplaintModal from '../components/modals/ComplaintModal';
import NoMatchModal from '../components/modals/NoMatchModal';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../lib/api';

const VideoChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matchUser, setMatchUser] = useState(null);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showDecision, setShowDecision] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showNoMatch, setShowNoMatch] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user?.profile_completed) {
      navigate('/complete-profile');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (session && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session, timeLeft]);

  const findMatch = async () => {
    setSearching(true);
    try {
      const response = await api.post('/matching/find-match');
      setMatchUser(response.data);
      
      // Start video session
      const sessionResponse = await api.post('/matching/video-session', {
        match_user_id: response.data.id
      });
      setSession(sessionResponse.data);
      setTimeLeft(60); // 1 минута для демонстрации
      
      toast.success('Собеседник найден!');
    } catch (error) {
      if (error.response?.status === 404) {
        setShowNoMatch(true);
      } else if (error.response?.status === 403) {
        toast.error('У вас закончились бесплатные общения на сегодня');
        navigate('/subscriptions');
      } else {
        toast.error(error.response?.data?.detail || 'Ошибка поиска');
      }
    } finally {
      setSearching(false);
    }
  };

  const createDemoMatch = async () => {
    try {
      const response = await api.post('/testing/create-demo-match');
      toast.success(`Демо-матч создан с ${response.data.partner_name}`);
      navigate('/matches');
    } catch (error) {
      toast.error('Ошибка создания демо-матча');
    }
  };

  const handleTimeEnd = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    try {
      await api.put(`/matching/video-session/${session.id}/end`);
    } catch (error) {
      console.error('Error ending session:', error);
    }
    
    setShowDecision(true);
  };

  const handleEndChat = async () => {
    if (!session) return;
    
    try {
      await api.put(`/matching/video-session/${session.id}/end`);
      setShowDecision(true);
    } catch (error) {
      toast.error('Ошибка завершения чата');
    }
  };

  const handleDecision = async (accepted) => {
    try {
      const response = await api.post('/matching/decision', {
        session_id: session.id,
        accepted
      });

      if (response.data.matched) {
        toast.success('Взаимная симпатия! Чат открыт');
        navigate(`/chat/${response.data.match_id}`);
      } else if (!accepted) {
        setShowComplaint(true);
      } else {
        toast.info('Ожидаем решения собеседника...');
        // Poll for result
        setTimeout(() => checkMatchResult(), 2000);
      }
    } catch (error) {
      toast.error('Ошибка обработки решения');
    }
    
    setShowDecision(false);
  };

  const checkMatchResult = async () => {
    // In real app, use WebSocket for real-time updates
    toast.info('Собеседник не заинтересован');
    resetChat();
  };

  const resetChat = () => {
    setMatchUser(null);
    setSession(null);
    setTimeLeft(600);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF]" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#FF5757]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#34C759]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <NavigationBar />
      
      <div className="flex-1 flex flex-col items-center justify-start pt-8 p-4" data-testid="videochat-container">
        {!session ? (
          <div className="w-full max-w-4xl space-y-6">
            <div className="bg-gradient-to-br from-[#2C2C54] to-[#474787] rounded-3xl p-8 aspect-video flex items-center justify-center shadow-2xl border border-white/10">
              <p className="text-white/80 text-lg text-center">
                Нажмите "Знакомиться" чтобы начать видео-знакомство
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setShowFilters(true)}
                className="text-[#1A73E8] font-medium hover:underline"
                data-testid="filters-button"
              >
                Фильтры
              </button>

              <Button
                onClick={findMatch}
                disabled={searching}
                className="w-full max-w-md py-6 rounded-full text-white font-semibold text-lg"
                style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
                data-testid="find-match-button"
              >
                {searching ? 'Поиск...' : 'ЗНАКОМИТЬСЯ'}
              </Button>
              
              <Button
                onClick={createDemoMatch}
                variant="outline"
                className="px-8 py-3 rounded-full"
                data-testid="create-demo-match-button"
              >
                Создать демо-матч для тестирования
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-6">
            <div className="relative">
              <VideoChatSimulator
                matchUser={matchUser}
                onTimeEnd={handleTimeEnd}
              />
              
              <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-sm text-white px-6 py-3 rounded-full font-mono text-2xl font-bold shadow-xl" data-testid="timer">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleEndChat}
                variant="destructive"
                className="px-8 py-3 rounded-full"
                data-testid="end-chat-button"
              >
                Завершить чат
              </Button>
            </div>
          </div>
        )}
      </div>

      <DecisionModal
        isOpen={showDecision}
        onClose={() => setShowDecision(false)}
        onDecision={handleDecision}
      />

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      <NoMatchModal
        isOpen={showNoMatch}
        onClose={() => setShowNoMatch(false)}
        onOpenFilters={() => setShowFilters(true)}
      />

      <ComplaintModal
        isOpen={showComplaint}
        onClose={() => {
          setShowComplaint(false);
          resetChat();
        }}
        reportedUserId={matchUser?.id}
      />
    </div>
  );
};

export default VideoChat;
