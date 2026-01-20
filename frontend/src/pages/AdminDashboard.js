import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import { 
  Users, AlertTriangle, Activity, MessageSquare, Ban, Trash2, 
  CreditCard, ArrowUpDown, Search, ChevronDown, ChevronUp, History, MessageCircle, 
  Key, Shield, UserCog, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import api from '../lib/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [subscriptionUsers, setSubscriptionUsers] = useState([]);
  const [planSettings, setPlanSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  
  // Documents state
  const [documents, setDocuments] = useState({ requisites: '', agreement: '' });
  const [editingDoc, setEditingDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForSub, setSelectedUserForSub] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('Серебро');
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [historyUser, setHistoryUser] = useState(null);
  
  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userForPassword, setUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Admin role modal
  const [showAdminRoleModal, setShowAdminRoleModal] = useState(false);
  const [userForRole, setUserForRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  // Super admin email (protected)
  const SUPER_ADMIN_EMAIL = 'admin@test.com';
  const ALL_PERMISSIONS = ['users', 'subscriptions', 'tariffs', 'complaints', 'feedback', 'stats'];
  
  const isSuperAdmin = user?.is_super_admin || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isProtectedAdmin = (userEmail) => userEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  
  // Get user's admin permissions (super admin has all permissions)
  const userPermissions = isSuperAdmin ? ALL_PERMISSIONS : (user?.admin_permissions || []);
  
  // Check if user has specific permission
  const hasPermission = (permission) => isSuperAdmin || userPermissions.includes(permission);

  useEffect(() => {
    // Check if user has admin access (via is_admin flag or legacy email check)
    const hasAdminAccess = user?.is_admin || user?.is_super_admin || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    
    if (!hasAdminAccess) {
      toast.error('Доступ запрещен');
      navigate('/videochat');
      return;
    }
    
    // Set initial tab to first available permission
    const userPerms = (user?.is_super_admin || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) 
      ? ALL_PERMISSIONS 
      : (user?.admin_permissions || []);
    
    const tabOrder = ['stats', 'users', 'subscriptions', 'tariffs', 'complaints', 'feedback'];
    const firstAvailable = tabOrder.find(t => userPerms.includes(t));
    if (firstAvailable && !userPerms.includes(activeTab)) {
      setActiveTab(firstAvailable);
    }
    
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      // Always load stats (it's fast)
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
      
      // Load other data in background without blocking
      Promise.all([
        api.get('/admin/users').then(res => setUsers(res.data)).catch(() => setUsers([])),
        api.get('/admin/complaints').then(res => setComplaints(res.data)).catch(() => setComplaints([])),
        api.get('/subscriptions/plans').then(res => setPlanSettings(res.data.map(p => ({ ...p, enabled: p.enabled !== false })))).catch(() => {}),
        api.get('/admin/subscription/active-users').then(res => setSubscriptionUsers(res.data)).catch(() => setSubscriptionUsers([])),
        api.get('/admin/feedbacks').then(res => setFeedbacks(res.data || [])).catch(() => setFeedbacks([])),
        // Load documents for super admin
        loadDocuments()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const [reqRes, agrRes] = await Promise.all([
        api.get('/documents/requisites'),
        api.get('/documents/agreement')
      ]);
      setDocuments({
        requisites: reqRes.data.content,
        agreement: agrRes.data.content
      });
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const saveDocument = async (docId) => {
    setSavingDoc(true);
    try {
      await api.put(`/documents/${docId}`, { content: docContent });
      setDocuments(prev => ({ ...prev, [docId]: docContent }));
      toast.success('Документ сохранён');
      setEditingDoc(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setSavingDoc(false);
    }
  };

  const openDocEditor = (docId) => {
    setDocContent(documents[docId] || '');
    setEditingDoc(docId);
  };

  // Quill editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  const handleBlockUser = async (userId, blocked) => {
    // Find the user to check if they're the super admin
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && isProtectedAdmin(targetUser.email)) {
      toast.error('Невозможно заблокировать супер-администратора');
      return;
    }
    
    try {
      await api.put(`/admin/user/${userId}/block?blocked=${!blocked}`);
      toast.success(`Пользователь ${!blocked ? 'заблокирован' : 'разблокирован'}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Check if trying to delete super admin
    if (isProtectedAdmin(userToDelete.email)) {
      toast.error('Невозможно удалить супер-администратора');
      setShowDeleteModal(false);
      setUserToDelete(null);
      return;
    }
    
    try {
      await api.delete(`/admin/user/${userToDelete.id}`);
      toast.success('Пользователь удалён');
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const handleChangePassword = async () => {
    if (!userForPassword || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }
    
    try {
      await api.post('/admin/user/change-password', {
        user_id: userForPassword.id,
        new_password: newPassword
      });
      toast.success('Пароль успешно изменён');
      setShowPasswordModal(false);
      setUserForPassword(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка смены пароля');
    }
  };

  const handleSetAdminRole = async () => {
    if (!userForRole) return;
    
    try {
      await api.put(`/admin/user/${userForRole.id}/admin-role`, {
        is_admin: true,
        permissions: selectedPermissions
      });
      toast.success('Права администратора назначены');
      setShowAdminRoleModal(false);
      setUserForRole(null);
      setSelectedPermissions([]);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка назначения роли');
    }
  };

  const handleRemoveAdminRole = async (userId) => {
    try {
      await api.put(`/admin/user/${userId}/admin-role`, {
        is_admin: false,
        permissions: []
      });
      toast.success('Права администратора сняты');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const togglePermission = (permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleActivateSubscription = async () => {
    if (!selectedUserForSub) return;
    try {
      await api.post(`/admin/subscription/activate?user_id=${selectedUserForSub.id}&plan_name=${encodeURIComponent(selectedPlan)}`);
      toast.success(`Тариф ${selectedPlan} активирован на 1 месяц`);
      setShowActivateModal(false);
      setSelectedUserForSub(null);
      setSelectedPlan('Серебро');
      loadData();
    } catch (error) {
      toast.error('Ошибка активации');
    }
  };

  const handleViewHistory = async (userItem) => {
    try {
      const response = await api.get(`/admin/subscription/history/${userItem.id}`);
      setSubscriptionHistory(response.data);
      setHistoryUser(userItem);
      setShowHistoryModal(true);
    } catch (error) {
      toast.error('Ошибка загрузки истории');
    }
  };

  const handleTogglePlan = async (planName) => {
    try {
      const plan = planSettings.find(p => p.name === planName);
      await api.put(`/admin/subscription/toggle?plan_name=${encodeURIComponent(planName)}&enabled=${!plan.enabled}`);
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
      
      if (sortField === 'created_at' || sortField === 'last_login' || sortField === 'subscription_activated_at') {
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

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-3 h-3 ml-1" /> : 
      <ChevronDown className="w-3 h-3 ml-1" />;
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
        <div className="flex gap-2 mb-6 border-b border-[#E5E5E5] overflow-x-auto">
          {[
            { id: 'stats', label: 'Статистика', icon: Activity, permission: 'stats' },
            { id: 'users', label: 'Пользователи', icon: Users, permission: 'users' },
            { id: 'subscriptions', label: 'Подписки', icon: CreditCard, permission: 'subscriptions' },
            { id: 'tariffs', label: 'Тарифы', icon: CreditCard, permission: 'tariffs' },
            { id: 'complaints', label: 'Жалобы', icon: AlertTriangle, permission: 'complaints' },
            { id: 'feedback', label: 'Обратная связь', icon: MessageCircle, permission: 'feedback' }
          ].filter(tab => hasPermission(tab.permission)).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#7A7A7A] hover:text-[#1F1F1F]'
                }`}
              >
                <Icon className="w-4 h-4" />
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
              { label: 'Активных подписок', value: stats.active_subscriptions || 0, icon: CreditCard, color: 'from-green-500 to-green-600' },
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
              <table className="w-full text-sm">
                <thead className="bg-[#F6F7F9]">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-[#1F1F1F]">Имя</th>
                    <th className="px-3 py-3 text-left font-semibold text-[#1F1F1F]">Email</th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5]"
                      onClick={() => toggleSort('age')}
                    >
                      <div className="flex items-center">
                        Возр.
                        {getSortIcon('age')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5]"
                      onClick={() => toggleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Рег.
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5]"
                      onClick={() => toggleSort('last_login')}
                    >
                      <div className="flex items-center">
                        Вход
                        {getSortIcon('last_login')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5]"
                      onClick={() => toggleSort('subscription_activated_at')}
                    >
                      <div className="flex items-center">
                        Подписка
                        {getSortIcon('subscription_activated_at')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#E5E5E5]"
                      onClick={() => toggleSort('complaint_count')}
                    >
                      <div className="flex items-center">
                        Жал.
                        {getSortIcon('complaint_count')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-[#1F1F1F]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map(u => (
                    <tr key={u.id} className="border-t border-[#E5E5E5] hover:bg-[#F6F7F9]">
                      <td className="px-3 py-2 text-[#1F1F1F]">{u.name}</td>
                      <td className="px-3 py-2 text-[#7A7A7A] text-xs">{u.email}</td>
                      <td className="px-3 py-2 text-[#7A7A7A]">{u.age || '-'}</td>
                      <td className="px-3 py-2 text-[#7A7A7A] text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '-'}
                      </td>
                      <td className="px-3 py-2 text-[#7A7A7A] text-xs">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString('ru-RU') : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {u.subscription_activated_at ? (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">
                              {new Date(u.subscription_activated_at).toLocaleDateString('ru-RU')}
                            </span>
                            <button 
                              onClick={() => handleViewHistory(u)}
                              className="text-[#1A73E8] hover:text-[#1557B5]"
                              title="История оплат"
                            >
                              <History className="w-3 h-3" />
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.complaint_count > 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.complaint_count}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {/* Показываем разные кнопки в зависимости от того, супер-админ это или нет */}
                          {isProtectedAdmin(u.email) ? (
                            <>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Супер
                              </span>
                              <Button
                                onClick={() => {
                                  setUserForPassword(u);
                                  setShowPasswordModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1 h-7"
                              >
                                <Key className="w-3 h-3 mr-1" />
                                Пароль
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleBlockUser(u.id, u.blocked)}
                                variant={u.blocked ? 'outline' : 'destructive'}
                                size="sm"
                                className="text-xs px-2 py-1 h-7"
                              >
                                {u.blocked ? 'Разбл.' : 'Забл.'}
                              </Button>
                              <Button
                                onClick={() => {
                                  setUserToDelete(u);
                                  setShowDeleteModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-500 hover:bg-red-50 px-2 py-1 h-7"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              {/* Показать кнопку назначения админа только супер-админу */}
                              {isSuperAdmin && (
                                <Button
                                  onClick={() => {
                                    if (u.is_admin) {
                                      handleRemoveAdminRole(u.id);
                                    } else {
                                      setUserForRole(u);
                                      setSelectedPermissions([]);
                                      setShowAdminRoleModal(true);
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className={`text-xs px-2 py-1 h-7 ${u.is_admin ? 'border-purple-500 text-purple-500' : ''}`}
                                  title={u.is_admin ? 'Снять админа' : 'Сделать админом'}
                                >
                                  <UserCog className="w-3 h-3" />
                                </Button>
                              )}
                              {/* Показать бейдж админа если пользователь - админ */}
                              {u.is_admin && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                  Админ
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F6F7F9] border-t-2 border-[#E5E5E5]">
                  <tr>
                    <td className="px-3 py-3 font-semibold text-[#1F1F1F]" colSpan={2}>
                      Итого: {sortedUsers.length}
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#7A7A7A]">
                      Ср: {totals.avgAge}
                    </td>
                    <td className="px-3 py-3" colSpan={3}></td>
                    <td className="px-3 py-3 font-semibold text-[#7A7A7A]">
                      {totals.totalComplaints}
                    </td>
                    <td className="px-3 py-3"></td>
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
                <table className="w-full text-sm">
                  <thead className="bg-[#F6F7F9]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-[#1F1F1F]">Имя</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1F1F1F]">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1F1F1F]">Подписка</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1F1F1F]">Активирована</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1F1F1F]">Истекает</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1F1F1F]">История</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#7A7A7A]">
                          Нет пользователей с активными подписками
                        </td>
                      </tr>
                    ) : (
                      subscriptionUsers.map(u => (
                        <tr key={u.id} className="border-t border-[#E5E5E5]">
                          <td className="px-4 py-3 text-[#1F1F1F]">{u.name}</td>
                          <td className="px-4 py-3 text-[#7A7A7A]">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                              {u.active_subscription}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#7A7A7A]">
                            {u.subscription_activated_at ? new Date(u.subscription_activated_at).toLocaleDateString('ru-RU') : '-'}
                          </td>
                          <td className="px-4 py-3 text-[#7A7A7A]">
                            {u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString('ru-RU') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              onClick={() => handleViewHistory(u)}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              <History className="w-4 h-4 mr-1" />
                              История
                            </Button>
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
                    <p className="text-2xl font-bold text-[#1A73E8] mt-1">{plan.price} ₽<span className="text-sm font-normal text-[#7A7A7A]"> в мес.</span></p>
                    <p className="text-sm text-[#7A7A7A]">+{plan.communications} общений <span className="font-medium">в день</span></p>
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

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {feedbacks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <MessageCircle className="w-12 h-12 text-[#9AA0A6] mx-auto mb-4" />
                <p className="text-[#7A7A7A]">Нет обратной связи</p>
              </div>
            ) : (
              feedbacks.map(fb => (
                <div key={fb.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        fb.type === 'bug' ? 'bg-red-100 text-red-700' :
                        fb.type === 'idea' ? 'bg-blue-100 text-blue-700' :
                        fb.type === 'suggestion' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {fb.type === 'bug' ? 'Ошибка' :
                         fb.type === 'idea' ? 'Идея' :
                         fb.type === 'suggestion' ? 'Предложение' : 'Другое'}
                      </span>
                      <p className="text-xs text-[#7A7A7A] mt-2">От: {fb.user_id}</p>
                    </div>
                    <p className="text-xs text-[#B5B5B5]">
                      {new Date(fb.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <p className="text-[#1F1F1F] text-sm bg-[#F6F7F9] p-4 rounded-lg">
                    {fb.message}
                  </p>
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
              <label className="text-sm text-[#7A7A7A] mb-2 block">Выберите тариф</label>
              <div className="grid grid-cols-3 gap-2">
                {['Серебро', 'Золото', 'VIP'].map(plan => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedPlan === plan
                        ? 'border-[#1A73E8] bg-[#1A73E8]/10'
                        : 'border-[#E5E5E5] hover:border-[#1A73E8]/50'
                    }`}
                  >
                    <span className={`font-semibold ${selectedPlan === plan ? 'text-[#1A73E8]' : 'text-[#1F1F1F]'}`}>
                      {plan}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#7A7A7A] text-center mt-2">
                Тариф активируется на 1 месяц
              </p>
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

      {/* Subscription History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
              История оплат
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-[#7A7A7A] mb-4">
              Пользователь: <span className="font-semibold text-[#1F1F1F]">{historyUser?.name}</span>
            </p>
            
            {subscriptionHistory.length === 0 ? (
              <p className="text-center text-[#7A7A7A]">Нет истории оплат</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {subscriptionHistory.map((item, index) => (
                  <div key={index} className="bg-[#F6F7F9] p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-[#1F1F1F]">{item.plan_name}</span>
                        <p className="text-sm text-[#7A7A7A]">
                          {item.price} ₽ • {item.communications_per_day} общений/день
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#7A7A7A]">
                          {new Date(item.purchase_date).toLocaleDateString('ru-RU')}
                        </p>
                        <p className="text-xs text-[#B5B5B5]">
                          {item.activated_by === 'admin' ? 'Админ' : 'Пользователь'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowHistoryModal(false)}
            variant="outline"
            className="w-full"
          >
            Закрыть
          </Button>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
              Смена пароля
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center text-[#7A7A7A]">
              Пользователь: <span className="font-semibold text-[#1F1F1F]">{userForPassword?.name}</span>
            </p>
            <p className="text-center text-[#7A7A7A] text-sm">
              {userForPassword?.email}
            </p>
            
            <div>
              <label className="text-sm text-[#7A7A7A] mb-2 block">Новый пароль</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                minLength={6}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowPasswordModal(false);
                setUserForPassword(null);
                setNewPassword('');
              }}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleChangePassword}
              className="flex-1"
              style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            >
              Изменить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Role Modal */}
      <Dialog open={showAdminRoleModal} onOpenChange={setShowAdminRoleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
              Назначить администратором
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center text-[#7A7A7A]">
              Пользователь: <span className="font-semibold text-[#1F1F1F]">{userForRole?.name}</span>
            </p>
            <p className="text-center text-[#7A7A7A] text-sm">
              {userForRole?.email}
            </p>
            
            <div>
              <label className="text-sm text-[#7A7A7A] mb-3 block font-medium">
                Выберите разделы доступа:
              </label>
              <div className="space-y-2">
                {ALL_PERMISSIONS.map(permission => {
                  const labels = {
                    users: 'Пользователи',
                    subscriptions: 'Подписки',
                    tariffs: 'Тарифы',
                    complaints: 'Жалобы',
                    feedback: 'Обратная связь',
                    stats: 'Статистика'
                  };
                  return (
                    <label 
                      key={permission}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPermissions.includes(permission)
                          ? 'border-[#1A73E8] bg-[#1A73E8]/10'
                          : 'border-[#E5E5E5] hover:border-[#1A73E8]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1A73E8] focus:ring-[#1A73E8]"
                      />
                      <span className={`font-medium ${selectedPermissions.includes(permission) ? 'text-[#1A73E8]' : 'text-[#1F1F1F]'}`}>
                        {labels[permission]}
                      </span>
                    </label>
                  );
                })}
              </div>
              <button
                onClick={() => setSelectedPermissions(selectedPermissions.length === ALL_PERMISSIONS.length ? [] : [...ALL_PERMISSIONS])}
                className="text-sm text-[#1A73E8] hover:underline mt-2"
              >
                {selectedPermissions.length === ALL_PERMISSIONS.length ? 'Снять все' : 'Выбрать все'}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowAdminRoleModal(false);
                setUserForRole(null);
                setSelectedPermissions([]);
              }}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSetAdminRole}
              disabled={selectedPermissions.length === 0}
              className="flex-1"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #E056FD 100%)' }}
            >
              Назначить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
