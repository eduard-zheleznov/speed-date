import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import api from '../lib/api';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Пожалуйста, введите сообщение');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feedback', {
        type,
        message: message.trim(),
        page: window.location.pathname
      });
      toast.success('Спасибо за обратную связь!');
      setMessage('');
      setType('suggestion');
      onClose();
    } catch (error) {
      toast.error('Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { value: 'idea', label: '💡 Идея', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'suggestion', label: '📝 Предложение', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'bug', label: '🐛 Ошибка', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'other', label: '💬 Другое', color: 'bg-gray-100 text-gray-700 border-gray-300' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Обратная связь
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-[#7A7A7A] text-center">
            Поделитесь идеями, предложениями или сообщите об ошибках
          </p>
          
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            {types.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`p-2 rounded-lg border-2 text-sm transition-all ${
                  type === t.value 
                    ? `${t.color} border-current` 
                    : 'bg-white border-[#E5E5E5] text-[#7A7A7A] hover:border-[#1A73E8]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          
          {/* Message */}
          <div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Опишите вашу идею, предложение или проблему..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            disabled={loading || !message.trim()}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
