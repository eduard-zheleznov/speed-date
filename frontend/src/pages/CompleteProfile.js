import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import api from '../lib/api';

const CompleteProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    gender: '',
    education: '',
    smoking: '',
    city: '',
    description: ''
  });

  useEffect(() => {
    if (user?.profile_completed) {
      navigate('/videochat');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/profile', {
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        gender: formData.gender,
        education: formData.education,
        smoking: formData.smoking,
        city: formData.city,
        description: formData.description || undefined
      });
      
      updateUser(response.data);
      toast.success('Профиль заполнен!');
      navigate('/filters');
    } catch (error) {
      toast.error('Ошибка сохранения профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1F1F1F] text-center mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Заполните профиль
        </h1>
        <p className="text-center text-[#7A7A7A] mb-8">
          Это поможет найти лучшие совпадения
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Возраст *</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="120"
                required
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                data-testid="profile-age-input"
              />
            </div>

            <div>
              <Label htmlFor="city">Город *</Label>
              <Input
                id="city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                data-testid="profile-city-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Рост (см) *</Label>
              <Input
                id="height"
                type="number"
                min="100"
                max="250"
                required
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
                data-testid="profile-height-input"
              />
            </div>

            <div>
              <Label htmlFor="weight">Вес (кг) *</Label>
              <Input
                id="weight"
                type="number"
                min="30"
                max="300"
                required
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                data-testid="profile-weight-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Пол *</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})} required>
              <SelectTrigger data-testid="profile-gender-select">
                <SelectValue placeholder="Выберите пол" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Мужской</SelectItem>
                <SelectItem value="female">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="education">Образование *</Label>
            <Select value={formData.education} onValueChange={(value) => setFormData({...formData, education: value})} required>
              <SelectTrigger data-testid="profile-education-select">
                <SelectValue placeholder="Выберите образование" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="higher">Высшее</SelectItem>
                <SelectItem value="secondary">Среднее</SelectItem>
                <SelectItem value="vocational">Средне-специальное</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="smoking">Отношение к курению *</Label>
            <Select value={formData.smoking} onValueChange={(value) => setFormData({...formData, smoking: value})} required>
              <SelectTrigger data-testid="profile-smoking-select">
                <SelectValue placeholder="Выберите отношение" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negative">Негативное</SelectItem>
                <SelectItem value="positive">Позитивное</SelectItem>
                <SelectItem value="neutral">Нейтральное</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">О себе (необязательно)</Label>
            <Textarea
              id="description"
              placeholder="Расскажите немного о себе..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              data-testid="profile-description-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            data-testid="save-profile-button"
          >
            {loading ? 'Сохранение...' : 'ПРОДОЛЖИТЬ'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
