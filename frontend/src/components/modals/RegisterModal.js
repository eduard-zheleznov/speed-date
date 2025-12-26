import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ageConfirmed) {
      toast.error('Подтвердите, что вам есть 18 лет');
      return;
    }

    setLoading(true);

    try {
      await register(email, name, password, ageConfirmed);
      toast.success('Регистрация успешна!');
      onClose();
      navigate('/complete-profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="register-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Регистрация
          </DialogTitle>
          <p className="text-center text-[#7A7A7A] mt-2">
            Зарегистрируйтесь, чтобы<br />начать видео знакомства
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-[#1F1F1F]">Имя</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
              data-testid="register-name-input"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-[#1F1F1F]">Электронная почта</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              data-testid="register-email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#1F1F1F]">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
              data-testid="register-password-input"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="age-confirm"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              data-testid="age-confirm-checkbox"
            />
            <label
              htmlFor="age-confirm"
              className="text-sm text-[#1F1F1F] cursor-pointer select-none"
            >
              Мне есть 18 лет
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #FF5757 0%, #FF7B7B 100%)' }}
            data-testid="register-submit-button"
          >
            {loading ? 'Регистрация...' : 'РЕГИСТРАЦИЯ'}
          </Button>

          <div className="text-center text-[#7A7A7A] text-sm">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#1A73E8] hover:underline"
              data-testid="switch-to-login-button"
            >
              Войти
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
