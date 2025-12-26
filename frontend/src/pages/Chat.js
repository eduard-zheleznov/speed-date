import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, ArrowLeft, Clock, HelpCircle, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import api from '../lib/api';

const Chat = () => {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [matchInfo, setMatchInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    loadChatData();
    const interval = setInterval(loadMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    // Only auto-scroll when new messages arrive, not on user scroll
    if (messages.length > lastMessageCountRef.current && !userScrolled) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, userScrolled]);

  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setUserScrolled(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadChatData = async () => {
    try {
      const [infoResponse, messagesResponse] = await Promise.all([
        api.get(`/chat/${matchId}/info`),
        api.get(`/chat/${matchId}/messages`)
      ]);
      
      setMatchInfo(infoResponse.data);
      setMessages(messagesResponse.data);
      lastMessageCountRef.current = messagesResponse.data.length;
      
      // Scroll to bottom on initial load
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      toast.error('Ошибка загрузки чата');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.get(`/chat/${matchId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setUserScrolled(false); // Reset scroll state when sending
    try {
      const response = await api.post(`/chat/${matchId}/message`, {
        text: newMessage
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  // Get partner's avatar
  const getPartnerAvatar = () => {
    if (matchInfo?.partner?.photos?.length > 0) {
      return matchInfo.partner.photos[0];
    }
    return null;
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

  const partnerAvatar = getPartnerAvatar();

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Fixed Navigation */}
      <div className="flex-shrink-0">
        <NavigationBar />
      </div>
      
      {/* Fixed Chat Header */}
      <div className="flex-shrink-0 border-b border-[#E5E5E5] px-4 py-3 bg-white shadow-sm z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate('/matches')} 
            data-testid="back-to-matches"
            className="flex items-center gap-2 text-[#1A73E8] hover:text-[#1557B5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Назад</span>
          </button>
          
          {/* Partner info - clickable */}
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 flex-1 hover:bg-[#F6F7F9] rounded-lg p-2 transition-colors"
          >
            {partnerAvatar ? (
              <img 
                src={partnerAvatar} 
                alt={matchInfo?.partner.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white font-bold">
                {matchInfo?.partner.name[0]}
              </div>
            )}
            <div className="text-left">
              <h2 className="text-base font-semibold text-[#1F1F1F]">
                {matchInfo?.partner.name}, {matchInfo?.partner.age}
              </h2>
              <div className="flex items-center gap-1 text-[#FF5757] text-xs">
                <Clock className="w-3 h-3" />
                <span>Чат удалится через {matchInfo?.expires_in_days} дней</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoModal(true);
                  }}
                  className="ml-1 text-[#7A7A7A] hover:text-[#1A73E8] transition-colors"
                  aria-label="Информация о чате"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gradient-to-br from-[#F8F9FA] to-white"
        data-testid="messages-container"
      >
        <div className="max-w-4xl mx-auto p-4">
          <div className="space-y-3 min-h-full">
            {messages.map((message) => {
              const isOwn = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.id}`}
                >
                  {/* Partner avatar for incoming messages */}
                  {!isOwn && (
                    <div className="flex-shrink-0 mr-2">
                      {partnerAvatar ? (
                        <img 
                          src={partnerAvatar} 
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-sm font-bold">
                          {matchInfo?.partner.name[0]}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-[#1A73E8] text-white'
                        : 'bg-white text-[#1F1F1F] shadow-sm border border-[#E5E5E5]'
                    }`}
                  >
                    <p className="break-words text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-white/70' : 'text-[#7A7A7A]'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Fixed Input at bottom */}
      <div className="flex-shrink-0 border-t border-[#E5E5E5] p-3 bg-white">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1"
            disabled={sending}
            data-testid="message-input"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            data-testid="send-message-button"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
              Информация о чате
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-[#7A7A7A]">
              Чат будет доступен для общения 30 дней, после этого времени будет удалён.
            </p>
          </div>
          <Button
            onClick={() => setShowInfoModal(false)}
            className="w-full py-4 rounded-full text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
          >
            ПОНЯТНО
          </Button>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
              Профиль собеседника
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              {partnerAvatar ? (
                <img 
                  src={partnerAvatar} 
                  alt={matchInfo?.partner.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-4xl font-bold">
                  {matchInfo?.partner.name[0]}
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[#1F1F1F]">
                {matchInfo?.partner.name}, {matchInfo?.partner.age}
              </h3>
              {matchInfo?.partner.city && (
                <p className="text-[#7A7A7A]">{matchInfo?.partner.city}</p>
              )}
              {matchInfo?.partner.description && (
                <p className="text-sm text-[#7A7A7A] mt-4 bg-[#F6F7F9] p-3 rounded-lg">
                  {matchInfo?.partner.description}
                </p>
              )}
            </div>

            {/* Additional photos */}
            {matchInfo?.partner.photos?.length > 1 && (
              <div className="mt-4">
                <p className="text-sm text-[#7A7A7A] mb-2">Фотографии:</p>
                <div className="flex gap-2 overflow-x-auto">
                  {matchInfo.partner.photos.map((photo, idx) => (
                    <img 
                      key={idx}
                      src={photo}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowProfileModal(false)}
            variant="outline"
            className="w-full"
          >
            Закрыть
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
