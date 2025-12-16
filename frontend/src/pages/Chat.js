import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, ArrowLeft, Clock } from 'lucide-react';
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatData();
    const interval = setInterval(loadMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatData = async () => {
    try {
      const [infoResponse, messagesResponse] = await Promise.all([
        api.get(`/chat/${matchId}/info`),
        api.get(`/chat/${matchId}/messages`)
      ]);
      
      setMatchInfo(infoResponse.data);
      setMessages(messagesResponse.data);
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
    try {
      const response = await api.post(`/chat/${matchId}/message`, {
        text: newMessage
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка отправки');
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-white flex flex-col">
      <NavigationBar />
      
      {/* Chat Header */}
      <div className="border-b border-[#E5E5E5] p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/matches')} data-testid="back-to-matches">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#1F1F1F]">
              {matchInfo?.partner.name}, {matchInfo?.partner.age}
            </h2>
            <div className="flex items-center gap-1 text-[#FF5757] text-sm">
              <Clock className="w-4 h-4" />
              <span>Чат истекает через {matchInfo?.expires_in_days} дн.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="messages-container">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.id}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    isOwn
                      ? 'bg-[#1A73E8] text-white'
                      : 'bg-[#F6F7F9] text-[#1F1F1F]'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
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

      {/* Input */}
      <div className="border-t border-[#E5E5E5] p-4">
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
            className="px-6"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            data-testid="send-message-button"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
