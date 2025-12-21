import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import api from '../lib/api';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        height: user.height || '',
        weight: user.weight || '',
        gender: user.gender || '',
        education: user.education || '',
        smoking: user.smoking || '',
        city: user.city || '',
        description: user.description || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const response = await api.put('/profile', {
        ...formData,
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight)
      });
      
      updateUser(response.data);
      toast.success('Профиль обновлен');
      setEditing(false);
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/auth/change-password', passwordData);
      toast.success('Пароль изменен');
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка смены пароля');
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс 5МБ)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ ...user, photos: response.data.photos });
      toast.success('Фото загружено');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки');
    }
  };

  const handleDeletePhoto = async (index) => {
    try {
      const response = await api.delete(`/profile/photo/${index}`);
      updateUser({ ...user, photos: response.data.photos });
      toast.success('Фото удалено');
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleSetMainPhoto = async (index) => {
    try {
      const response = await api.post(`/profile/set-main-photo?photo_index=${index}`);
      updateUser({ ...user, photos: response.data.photos });
      toast.success('Главное фото обновлено');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7B61FF]/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <NavigationBar />
        
        <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#1F1F1F]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Мой профиль
            </h1>
            <Button
              onClick={() => setEditing(!editing)}
              variant="outline"
              data-testid="edit-profile-button"
            >
              {editing ? 'Отмена' : 'Редактировать'}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Profile Photos */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Фото профиля</Label>
              <p className="text-sm text-[#7A7A7A] mb-4">
                Загрузите до 3 фотографий. Первая будет главной (аватар).
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                {user?.photos?.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border-2 border-[#1A73E8]/30 hover:border-[#1A73E8] transition-all"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-[#1A73E8] to-[#6A9EFF] text-white text-xs px-3 py-1 rounded-full shadow-lg">
                        ⭐ Главное
                      </div>
                    )}
                    {editing && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        {index !== 0 && (
                          <button
                            onClick={() => handleSetMainPhoto(index)}
                            className="bg-[#1A73E8] hover:bg-[#1557B5] text-white text-xs px-3 py-2 rounded-lg shadow-lg transition-all"
                          >
                            Сделать главным
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(index)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg transition-all"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {(!user?.photos || user.photos.length < 3) && editing && (
                  <label className="w-full aspect-square border-2 border-dashed border-[#1A73E8]/50 hover:border-[#1A73E8] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#1A73E8]/5 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPhoto}
                      className="hidden"
                      data-testid="upload-photo-input"
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#6A9EFF] flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#1A73E8]">Загрузить</span>
                  </label>
                )}
                
                {/* Placeholder if no photos */}
                {(!user?.photos || user.photos.length === 0) && !editing && (
                  <div className="col-span-3 flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#E5E5E5] rounded-xl">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-4xl font-bold mb-4">
                      {user?.name?.[0]}
                    </div>
                    <p className="text-[#7A7A7A] text-sm">Фотографий пока нет</p>
                  </div>
                )}
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="p-4 bg-[#F6F7F9] rounded-xl border border-[#E5E5E5]">
              <Label className="text-xs text-[#7A7A7A]">Электронная почта</Label>
              <p className="text-[#1F1F1F] font-medium mt-1">{user?.email}</p>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Имя</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!editing}
                  data-testid="profile-name"
                />
              </div>

              <div>
                <Label>Возраст</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  disabled={!editing}
                  data-testid="profile-age"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Рост (см)</Label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  disabled={!editing}
                />
              </div>

              <div>
                <Label>Вес (кг)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  disabled={!editing}
                />
              </div>
            </div>

            <div>
              <Label>Город</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                disabled={!editing}
              />
            </div>

            <div>
              <Label>О себе</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={!editing}
                rows={4}
              />
            </div>

            {editing && (
              <Button
                onClick={handleSave}
                className="w-full py-6 rounded-full text-white font-semibold text-lg"
                style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
                data-testid="save-profile"
              >
                СОХРАНИТЬ
              </Button>
            )}

            <Button
              onClick={() => setShowPasswordModal(true)}
              variant="outline"
              className="w-full"
              data-testid="change-password-button"
            >
              Изменить пароль
            </Button>

            <Button
              onClick={logout}
              variant="destructive"
              className="w-full"
              data-testid="logout-button"
            >
              Выйти
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" style={{ color: '#1F1F1F' }}>
              Изменение пароля
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            <div>
              <Label>Текущий пароль</Label>
              <Input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            >
              ИЗМЕНИТЬ
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Profile;
