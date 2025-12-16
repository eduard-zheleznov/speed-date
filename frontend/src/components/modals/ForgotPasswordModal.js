import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import api from '../../lib/api';

const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Инструкции отправлены на почту (мок)');
      setEmail('');
      setTimeout(() => {
        onClose();
        onBackToLogin();
      }, 2000);
    } catch (error) {
      toast.error('Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="forgot-password-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Восстановление пароля
          </DialogTitle>
          <p className="text-center text-[#7A7A7A] mt-2">
            Введите ваш email, и мы отправим<br />инструкции по восстановлению
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="reset-email" className="text-[#1F1F1F]">Электронная почта</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              data-testid="forgot-password-email-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            data-testid="forgot-password-submit-button"
          >
            {loading ? 'Отправка...' : 'ОТПРАВИТЬ'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onBackToLogin();
              }}
              className="text-[#1A73E8] text-sm hover:underline"
              data-testid="back-to-login-button"
            >
              Вернуться ко входу
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
