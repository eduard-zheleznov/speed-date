import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import { Users, AlertTriangle, Activity, MessageSquare, Ban } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../lib/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!user?.email?.includes('admin')) {
      toast.error('Доступ запрещен');
      navigate('/videochat');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, complaintsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/complaints')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setComplaints(complaintsRes.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, blocked) => {
    try {
      await api.put(`/admin/user/${userId}/block?blocked=${!blocked}`);
      toast.success(`Пользователь ${!blocked ? 'заблокирован' : 'разблокирован'}`);
      loadData();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#7A7A7A]">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-8">Админ Панель</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#E5E5E5]">
          {[
            { id: 'stats', label: 'Статистика', icon: Activity },
            { id: 'users', label: 'Пользователи', icon: Users },
            { id: 'complaints', label: 'Жалобы', icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#7A7A7A] hover:text-[#1F1F1F]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Всего пользователей', value: stats.total_users, icon: Users, color: 'from-blue-500 to-blue-600' },
              { label: 'Заблокированы', value: stats.blocked_users, icon: Ban, color: 'from-red-500 to-red-600' },
              { label: 'Всего совпадений', value: stats.total_matches, icon: MessageSquare, color: 'from-green-500 to-green-600' },
              { label: 'Активных чатов', value: stats.active_matches, icon: Activity, color: 'from-purple-500 to-purple-600' },
              { label: 'Видео сессий', value: stats.total_video_sessions, icon: Activity, color: 'from-orange-500 to-orange-600' },
              { label: 'Жалоб', value: stats.total_complaints, icon: AlertTriangle, color: 'from-yellow-500 to-yellow-600' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[#7A7A7A] text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#1F1F1F]">{stat.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F6F7F9]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Имя</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Возраст</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Город</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Жалобы</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-[#E5E5E5]">
                      <td className="px-6 py-4 text-sm text-[#1F1F1F]">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-[#7A7A7A]">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-[#7A7A7A]">{u.age || '-'}</td>
                      <td className="px-6 py-4 text-sm text-[#7A7A7A]">{u.city || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.complaint_count > 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.complaint_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleBlockUser(u.id, u.blocked)}
                          variant={u.blocked ? 'outline' : 'destructive'}
                          size="sm"
                        >
                          {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-[#9AA0A6] mx-auto mb-4" />
                <p className="text-[#7A7A7A]">Нет жалоб</p>
              </div>
            ) : (
              complaints.map(complaint => (
                <div key={complaint.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-[#7A7A7A]">
                        Жалоба от: {complaint.complainant_id}
                      </p>
                      <p className="text-sm text-[#7A7A7A]">
                        На: {complaint.reported_user_id}
                      </p>
                    </div>
                    <p className="text-xs text-[#B5B5B5]">
                      {new Date(complaint.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {complaint.reason && (
                    <p className="text-[#1F1F1F] text-sm bg-[#F6F7F9] p-4 rounded-lg">
                      {complaint.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
