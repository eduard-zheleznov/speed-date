import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import api from '../lib/api';

const Filters = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    age_range: '25-35',
    gender_preference: 'female',
    city: 'Moscow',
    smoking_preference: 'negative'
  });

  useEffect(() => {
    if (!user?.profile_completed) {
      navigate('/complete-profile');
      return;
    }
    loadFilters();
  }, [user, navigate]);

  const loadFilters = async () => {
    try {
      const response = await api.get('/filters');
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/filters', formData);
      toast.success('Фильтры сохранены!');
      navigate('/videochat');
    } catch (error) {
      toast.error('Ошибка сохранения фильтров');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-[#1F1F1F] text-center mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Я ищу
        </h1>
        <p className="text-center text-[#7A7A7A] mb-8">
          Установите предпочтения для поиска собеседника
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="age-range">Возраст</Label>
            <Select value={formData.age_range} onValueChange={(value) => setFormData({...formData, age_range: value})} required>
              <SelectTrigger data-testid="filter-age-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18-25">18-25</SelectItem>
                <SelectItem value="25-35">25-35</SelectItem>
                <SelectItem value="35-45">35-45</SelectItem>
                <SelectItem value="45-55">45-55</SelectItem>
                <SelectItem value="55+">от 55</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gender">Пол собеседника</Label>
            <Select value={formData.gender_preference} onValueChange={(value) => setFormData({...formData, gender_preference: value})} required>
              <SelectTrigger data-testid="filter-gender-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Мужской</SelectItem>
                <SelectItem value="female">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city">Город</Label>
            <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})} required>
              <SelectTrigger data-testid="filter-city-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Moscow">Москва</SelectItem>
                <SelectItem value="Saint Petersburg">Санкт-Петербург</SelectItem>
                <SelectItem value="Novosibirsk">Новосибирск</SelectItem>
                <SelectItem value="Yekaterinburg">Екатеринбург</SelectItem>
                <SelectItem value="Kazan">Казань</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="smoking">Отношение к курению</Label>
            <Select value={formData.smoking_preference} onValueChange={(value) => setFormData({...formData, smoking_preference: value})} required>
              <SelectTrigger data-testid="filter-smoking-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Неважно</SelectItem>
                <SelectItem value="negative">Отрицательное</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
            data-testid="save-filters-button"
          >
            {loading ? 'Сохранение...' : 'СОХРАНИТЬ'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Filters;
