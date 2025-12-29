import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { RUSSIAN_CITIES } from '../data/russianCities';

const Filters = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [formData, setFormData] = useState({
    age_range: '25-35',
    gender_preference: 'female',
    city: '',
    smoking_preference: 'any',
    // Premium filters
    height_range: 'any',
    weight_range: 'any',
    education_preference: 'any'
  });

  useEffect(() => {
    if (!user?.profile_completed) {
      navigate('/complete-profile');
      return;
    }
    loadFilters();
    checkSubscription();
  }, [user, navigate]);

  const checkSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/my-status');
      // User has premium if they have premium_available > 0
      setHasSubscription(response.data.premium_available > 0);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await api.get('/filters');
      setFormData(prev => ({ ...prev, ...response.data }));
      setCitySearch(response.data.city || '');
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return RUSSIAN_CITIES.slice(0, 20);
    return RUSSIAN_CITIES.filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 20);
  }, [citySearch]);

  const handleCitySelect = (city) => {
    setFormData({ ...formData, city });
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.city) {
      toast.error('Пожалуйста, выберите город');
      return;
    }
    
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

          <div className="relative">
            <Label htmlFor="city">Город</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7A7A7A] z-10" />
              <Input
                id="city"
                type="text"
                placeholder="Начните вводить название..."
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, city: '' });
                  }
                }}
                onFocus={() => setShowCityDropdown(true)}
                className="pl-10"
                data-testid="filter-city-input"
              />
            </div>
            
            {/* City dropdown */}
            {showCityDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.length === 0 ? (
                  <div className="p-3 text-center text-[#7A7A7A] text-sm">
                    Город не найден
                  </div>
                ) : (
                  filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#F6F7F9] transition-colors ${
                        formData.city === city ? 'bg-[#1A73E8]/10 text-[#1A73E8]' : 'text-[#1F1F1F]'
                      }`}
                    >
                      {city}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="smoking">Отношение к курению</Label>
            <Select value={formData.smoking_preference} onValueChange={(value) => setFormData({...formData, smoking_preference: value})} required>
              <SelectTrigger data-testid="filter-smoking-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Неважно</SelectItem>
                <SelectItem value="negative">Отрицательно</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Premium Filters - only visible for subscribers */}
          {hasSubscription && (
            <div className="space-y-6 pt-4 border-t border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#7B61FF] bg-[#7B61FF]/10 px-2 py-1 rounded-full">
                  ПРЕМИУМ ФИЛЬТРЫ
                </span>
              </div>
              
              <div>
                <Label htmlFor="height">Рост</Label>
                <Select value={formData.height_range} onValueChange={(value) => setFormData({...formData, height_range: value})}>
                  <SelectTrigger data-testid="filter-height-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Неважно</SelectItem>
                    <SelectItem value="150-160">150-160 см</SelectItem>
                    <SelectItem value="160-170">160-170 см</SelectItem>
                    <SelectItem value="170-180">170-180 см</SelectItem>
                    <SelectItem value="180-190">180-190 см</SelectItem>
                    <SelectItem value="190+">190+ см</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weight">Вес</Label>
                <Select value={formData.weight_range} onValueChange={(value) => setFormData({...formData, weight_range: value})}>
                  <SelectTrigger data-testid="filter-weight-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Неважно</SelectItem>
                    <SelectItem value="40-50">40-50 кг</SelectItem>
                    <SelectItem value="50-60">50-60 кг</SelectItem>
                    <SelectItem value="60-70">60-70 кг</SelectItem>
                    <SelectItem value="70-80">70-80 кг</SelectItem>
                    <SelectItem value="80-90">80-90 кг</SelectItem>
                    <SelectItem value="90+">90+ кг</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="education">Образование</Label>
                <Select value={formData.education_preference} onValueChange={(value) => setFormData({...formData, education_preference: value})}>
                  <SelectTrigger data-testid="filter-education-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Неважно</SelectItem>
                    <SelectItem value="higher">Высшее</SelectItem>
                    <SelectItem value="secondary">Среднее</SelectItem>
                    <SelectItem value="vocational">Средне-специальное</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!hasSubscription && (
            <div className="bg-gradient-to-r from-[#7B61FF]/10 to-[#E056FD]/10 rounded-2xl p-4 border border-[#7B61FF]/20">
              <p className="text-sm text-[#7A7A7A] text-center">
                🔒 Доп. фильтры (рост, вес, образование) доступны с подпиской
              </p>
            </div>
          )}

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
      
      {/* Click outside to close city dropdown */}
      {showCityDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowCityDropdown(false)}
        />
      )}
    </div>
  );
};

export default Filters;
