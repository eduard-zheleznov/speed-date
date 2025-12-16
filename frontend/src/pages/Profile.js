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
            {/* Profile Picture Placeholder */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7B61FF] to-[#E056FD] flex items-center justify-center text-white text-5xl font-bold">
                {user?.name?.[0]}
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
