import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const Subscriptions = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansResponse, statusResponse, userResponse] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/my-status'),
        api.get('/auth/me')
      ]);
      
      setPlans(plansResponse.data);
      setStatus(statusResponse.data);
      
      // Check if user has active subscription
      const userData = userResponse.data;
      if (userData.active_subscription && userData.subscription_expires_at) {
        const expiresAt = new Date(userData.subscription_expires_at);
        if (expiresAt > new Date()) {
          setCurrentPlan(userData.active_subscription);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (planName, enabled) => {
    if (!enabled) {
      toast.error('Тариф временно не доступен');
      return;
    }
    
    // If user already has a subscription, show confirmation
    if (currentPlan && currentPlan !== planName) {
      setSelectedPlan(planName);
      setShowConfirmModal(true);
    } else {
      handlePurchase(planName);
    }
  };

  const handlePurchase = async (planName) => {
    try {
      const response = await api.post(`/subscriptions/purchase?plan_name=${encodeURIComponent(planName)}`);
      toast.success(response.data.message);
      setShowConfirmModal(false);
      setSelectedPlan(null);
      loadData(); // Reload status
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка покупки');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <NavigationBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#7A7A7A]">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Plan colors without gradients
  const planColors = ['#9CA3AF', '#F59E0B', '#8B5CF6']; // Silver, Gold, VIP

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF]" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <NavigationBar />
      
        <div className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-[#1F1F1F] text-center mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Тарифные планы
            </h1>
            
            {status && (
              <div className="text-center mb-8">
                <p className="text-[#7A7A7A]">
                  На сегодня осталось общений:{' '}
                  <span className="font-bold text-[#1A73E8]" data-testid="remaining-communications">
                    {status.total_available}
                  </span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {plans.map((plan, index) => {
                const isEnabled = plan.enabled !== false;
                const color = planColors[index];

                return (
                  <div
                    key={plan.name}
                    className={`rounded-3xl p-8 border-2 transition-all ${
                      !isEnabled 
                        ? 'opacity-60 bg-gray-100 border-gray-300' 
                        : 'bg-white border-[#E5E5E5] hover:border-[#1A73E8] hover:shadow-xl'
                    }`}
                    data-testid={`plan-card-${plan.name}`}
                  >
                    <div className="text-center mb-6">
                      <div
                        className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg ${
                          !isEnabled ? 'opacity-50' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        <Check className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-[#1F1F1F]">
                        {plan.name}
                      </h3>
                      <div className="text-4xl font-bold mb-1 text-[#1F1F1F]">
                        {plan.price} ₽<span className="text-base font-normal text-[#7A7A7A]"> в мес.</span>
                      </div>
                      <p className="text-[#7A7A7A] text-sm">
                        +{plan.communications} общений <span className="font-medium">в день</span>
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-[#1F1F1F]">
                        <Check className="w-5 h-5 text-[#34C759]" />
                        <span>Дополнительные знакомства</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#1F1F1F]">
                        <Check className="w-5 h-5 text-[#34C759]" />
                        <span>Найти свою пару быстрее</span>
                      </li>
                      <li className="flex items-center gap-2 text-[#1F1F1F]">
                        <Check className="w-5 h-5 text-[#34C759]" />
                        <span>Еще больше фильтров</span>
                      </li>
                    </ul>

                    {!isEnabled && (
                      <p className="text-center text-red-500 text-sm mb-4 font-medium">
                        Тариф временно не доступен
                      </p>
                    )}

                    <Button
                      onClick={() => handlePurchaseClick(plan.name, isEnabled)}
                      disabled={!isEnabled}
                      className={`w-full py-6 rounded-full text-white font-semibold text-lg ${
                        !isEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                      }`}
                      style={{ backgroundColor: isEnabled ? color : '#9CA3AF' }}
                      data-testid={`purchase-${plan.name}-button`}
                    >
                      {currentPlan === plan.name ? 'ТЕКУЩИЙ ПЛАН' : isEnabled ? 'ОПЛАТИТЬ' : 'НЕ ДОСТУПЕН'}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[#7A7A7A] text-sm mt-8">
              * Оплата через ЮKassa
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Plan Change */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2" style={{ color: '#1F1F1F' }}>
              <AlertTriangle className="w-6 h-6 text-[#FFA726]" />
              Смена тарифа
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 mb-4">
              <p className="text-center text-[#1F1F1F]">
                План будет переключен на новый, прошлый план полностью обнулится. Деньги не возвращаются.
              </p>
            </div>
            <p className="text-center text-[#7A7A7A] text-sm">
              Текущий план: <span className="font-semibold text-[#1F1F1F]">{currentPlan}</span>
              <br />
              Новый план: <span className="font-semibold text-[#1A73E8]">{selectedPlan}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedPlan(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={() => handlePurchase(selectedPlan)}
              className="flex-1"
              style={{ background: 'linear-gradient(135deg, #FF5757 0%, #FF8E8E 100%)' }}
            >
              Подтвердить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
