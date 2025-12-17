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

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
                      className="w-full aspect-square object-cover rounded-xl border-2 border-[#E5E5E5]"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-[#1A73E8] text-white text-xs px-2 py-1 rounded-full">
                        Главное
                      </div>
                    )}
                    {editing && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        {index !== 0 && (
                          <button
                            onClick={() => handleSetMainPhoto(index)}
                            className="bg-[#1A73E8] text-white text-xs px-3 py-1 rounded-full"
                          >
                            Сделать главным
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(index)}
                          className="bg-red-500 text-white text-xs px-3 py-1 rounded-full"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {(!user?.photos || user.photos.length < 3) && editing && (
                  <label className="w-full aspect-square border-2 border-dashed border-[#E5E5E5] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#1A73E8] hover:bg-[#F6F7F9] transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPhoto}
                      className="hidden"
                      data-testid="upload-photo-input"
                    />
                    <svg className="w-8 h-8 text-[#9AA0A6] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-[#7A7A7A]">Загрузить</span>
                  </label>
                )}
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <Label>Электронная почта</Label>
              <Input value={user?.email} disabled />
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
  );
};

export default Profile;
