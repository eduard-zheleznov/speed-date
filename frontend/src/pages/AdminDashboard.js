import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import { 
  Users, AlertTriangle, Activity, MessageSquare, Ban, Trash2, 
  CreditCard, ArrowUpDown, Search, ChevronDown, ChevronUp, X 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import api from '../lib/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [subscriptionUsers, setSubscriptionUsers] = useState([]);
  const [planSettings, setPlanSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForSub, setSelectedUserForSub] = useState(null);
  const [communicationsToAdd, setCommunicationsToAdd] = useState(5);

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
      const [statsRes, usersRes, complaintsRes, plansRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/complaints'),
        api.get('/subscriptions/plans')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setComplaints(complaintsRes.data);
      setPlanSettings(plansRes.data.map(p => ({ ...p, enabled: p.enabled !== false })));
      
      // Filter users with active subscriptions
      const usersWithSubs = usersRes.data.filter(u => u.premium_count > 0);
      setSubscriptionUsers(usersWithSubs);
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/admin/user/${userToDelete.id}`);
      toast.success('Пользователь удалён');
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleActivateSubscription = async () => {
    if (!selectedUserForSub) return;
    try {
      await api.post(`/admin/subscription/activate?user_id=${selectedUserForSub.id}&communications=${communicationsToAdd}`);
      toast.success(`Добавлено ${communicationsToAdd} общений`);
      setShowActivateModal(false);
      setSelectedUserForSub(null);
      setCommunicationsToAdd(5);
      loadData();
    } catch (error) {
      toast.error('Ошибка активации');
    }
  };

  const handleTogglePlan = async (planName) => {
    try {
      const plan = planSettings.find(p => p.name === planName);
      await api.put(`/admin/subscription/toggle?plan_name=${planName}&enabled=${!plan.enabled}`);
      setPlanSettings(prev => prev.map(p => 
        p.name === planName ? { ...p, enabled: !p.enabled } : p
      ));
      toast.success(`Тариф ${planName} ${plan.enabled ? 'отключён' : 'включён'}`);
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  // Sort function
  const sortUsers = (usersToSort) => {
    return [...usersToSort].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'created_at' || sortField === 'last_login') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      }
      
      if (sortField === 'age' || sortField === 'complaint_count') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Calculate column totals
  const calculateTotals = (data) => {
    return {
      totalAge: data.reduce((sum, u) => sum + (u.age || 0), 0),
      avgAge: data.length ? Math.round(data.reduce((sum, u) => sum + (u.age || 0), 0) / data.filter(u => u.age).length) : 0,
      totalComplaints: data.reduce((sum, u) => sum + (u.complaint_count || 0), 0)
    };
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = sortUsers(filteredUsers);
  const totals = calculateTotals(sortedUsers);

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
        <div className="flex gap-4 mb-6 border-b border-[#E5E5E5] overflow-x-auto">
          {[
            { id: 'stats', label: 'Статистика', icon: Activity },
            { id: 'users', label: 'Пользователи', icon: Users },
            { id: 'subscriptions', label: 'Подписки', icon: CreditCard },
            { id: 'tariffs', label: 'Тарифы', icon: CreditCard },
            { id: 'complaints', label: 'Жалобы', icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
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
            {/* Search */}
            <div className="p-4 border-b border-[#E5E5E5]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7A7A7A]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени или email..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F6F7F9]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F]">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F]">Email</th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5] transition-colors"
                      onClick={() => toggleSort('age')}
                    >
                      <div className="flex items-center">
                        Возраст
                        <SortIcon field="age" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F]">Город</th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5] transition-colors"
                      onClick={() => toggleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Регистрация
                        <SortIcon field="created_at" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5] transition-colors"
                      onClick={() => toggleSort('last_login')}
                    >
                      <div className="flex items-center">
                        Последний вход
                        <SortIcon field="last_login" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5] transition-colors"
                      onClick={() => toggleSort('complaint_count')}
                    >
                      <div className="flex items-center">
                        Жалобы
                        <SortIcon field="complaint_count" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1F1F1F]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map(u => (
                    <tr key={u.id} className="border-t border-[#E5E5E5] hover:bg-[#F6F7F9]">
                      <td className="px-4 py-3 text-sm text-[#1F1F1F]">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-[#7A7A7A]">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-[#7A7A7A]">{u.age || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#7A7A7A]">{u.city || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#7A7A7A]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#7A7A7A]">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString('ru-RU') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.complaint_count > 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.complaint_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBlockUser(u.id, u.blocked)}
                            variant={u.blocked ? 'outline' : 'destructive'}
                            size="sm"
                          >
                            {u.blocked ? 'Разблок.' : 'Заблок.'}
                          </Button>
                          <Button
                            onClick={() => {
                              setUserToDelete(u);
                              setShowDeleteModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F6F7F9] border-t-2 border-[#E5E5E5]">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-[#1F1F1F]" colSpan={2}>
                      Итого: {sortedUsers.length} пользователей
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#7A7A7A]">
                      Ср.: {totals.avgAge}
                    </td>
                    <td className="px-4 py-3" colSpan={3}></td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#7A7A7A]">
                      Всего: {totals.totalComplaints}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Activate subscription for user */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4">Активировать подписку</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm text-[#7A7A7A] mb-2 block">Поиск пользователя</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7A7A7A]" />
                    <Input
                      placeholder="Имя или email..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const found = users.find(u => 
                      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.name?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (found) {
                      setSelectedUserForSub(found);
                      setShowActivateModal(true);
                    } else {
                      toast.error('Пользователь не найден');
                    }
                  }}
                  className="px-6"
                  style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
                >
                  Найти и активировать
                </Button>
              </div>
            </div>

            {/* Users with active subscriptions */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5E5E5]">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">Пользователи с активными подписками</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F7F9]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Имя</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#1F1F1F]">Премиум общения</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-[#7A7A7A]">
                          Нет пользователей с активными подписками
                        </td>
                      </tr>
                    ) : (
                      subscriptionUsers.map(u => (
                        <tr key={u.id} className="border-t border-[#E5E5E5]">
                          <td className="px-6 py-4 text-sm text-[#1F1F1F]">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-[#7A7A7A]">{u.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                              {u.premium_count || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tariffs Tab */}
        {activeTab === 'tariffs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planSettings.map((plan, index) => {
              const gradients = [
                'linear-gradient(135deg, #A8A9AD 0%, #D7D8DC 50%, #B8B9BD 100%)',
                'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                'linear-gradient(135deg, #7B61FF 0%, #E056FD 100%)'
              ];

              return (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-6 shadow-sm transition-all ${
                    plan.enabled 
                      ? 'bg-white' 
                      : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div className="text-center mb-4">
                    <div
                      className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                        !plan.enabled ? 'grayscale' : ''
                      }`}
                      style={{ background: gradients[index] }}
                    >
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1F1F1F]">{plan.name}</h3>
                    <p className="text-2xl font-bold text-[#1A73E8] mt-1">{plan.price} ₽</p>
                    <p className="text-sm text-[#7A7A7A]">+{plan.communications} общений</p>
                  </div>

                  {!plan.enabled && (
                    <p className="text-center text-red-500 text-sm mb-4 font-medium">
                      Тариф временно не доступен
                    </p>
                  )}

                  <Button
                    onClick={() => handleTogglePlan(plan.name)}
                    variant={plan.enabled ? 'destructive' : 'default'}
                    className="w-full"
                  >
                    {plan.enabled ? 'Отключить' : 'Включить'}
                  </Button>
                </div>
              );
            })}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-red-500">
              Удаление пользователя
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-[#7A7A7A]">
              Вы уверены, что хотите безвозвратно удалить пользователя{' '}
              <span className="font-semibold text-[#1F1F1F]">{userToDelete?.name}</span>?
            </p>
            <p className="text-center text-red-500 text-sm mt-2">
              Это действие нельзя отменить. Все данные пользователя будут удалены.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleDeleteUser}
              variant="destructive"
              className="flex-1"
            >
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate Subscription Modal */}
      <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
              Активировать подписку
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center text-[#7A7A7A]">
              Пользователь: <span className="font-semibold text-[#1F1F1F]">{selectedUserForSub?.name}</span>
            </p>
            <p className="text-center text-[#7A7A7A] text-sm">
              {selectedUserForSub?.email}
            </p>
            
            <div>
              <label className="text-sm text-[#7A7A7A] mb-2 block">Количество общений</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={communicationsToAdd}
                onChange={(e) => setCommunicationsToAdd(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowActivateModal(false)}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleActivateSubscription}
              className="flex-1"
              style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
            >
              Активировать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
