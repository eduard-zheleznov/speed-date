import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

const LoginModal = ({ isOpen, onClose, onSwitchToRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Успешный вход!');
      onClose();
      navigate('/videochat');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail;
      if (errorMessage === 'Invalid credentials') {
        toast.error('Неверный email или пароль');
      } else if (errorMessage === 'User not found') {
        toast.error('Пользователь не найден. Зарегистрируйтесь.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Ошибка сети. Проверьте подключение.');
      } else {
        toast.error(errorMessage || 'Ошибка входа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="login-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Вход
          </DialogTitle>
          <p className="text-center text-[#7A7A7A] mt-2">
            Введите логин и пароль, чтобы<br />начать видео знакомства
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email" className="text-[#1F1F1F]">Логин</Label>
            <Input
              id="email"
              type="email"
              placeholder="Электронная почта"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              data-testid="login-email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#1F1F1F]">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
            data-testid="login-submit-button"
          >
            {loading ? 'Вход...' : 'ВОЙТИ'}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[#1A73E8] text-sm hover:underline"
              data-testid="forgot-password-button"
            >
              Забыли пароль?
            </button>
            <div className="text-[#7A7A7A] text-sm">
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#1A73E8] hover:underline"
                data-testid="switch-to-register-button"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
