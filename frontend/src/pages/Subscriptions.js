import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const Subscriptions = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansResponse, statusResponse] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/my-status')
      ]);
      
      setPlans(plansResponse.data);
      setStatus(statusResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planName) => {
    try {
      const response = await api.post(`/subscriptions/purchase?plan_name=${planName}`);
      toast.success(response.data.message);
      loadData(); // Reload status
    } catch (error) {
      toast.error('Ошибка покупки');
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F4FF]" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-[#FFD93D]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#1A73E8]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
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
                У вас осталось полноценных общений:{' '}
                <span className="font-bold text-[#1A73E8]" data-testid="remaining-communications">
                  {status.total_available}
                </span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {plans.map((plan, index) => {
              const gradients = [
                'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 100%)', // Silver
                'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Gold
                'linear-gradient(135deg, #7B61FF 0%, #E056FD 100%)'  // VIP
              ];

              return (
                <div
                  key={plan.name}
                  className="bg-white rounded-3xl p-8 border-2 border-[#E5E5E5] hover:border-[#1A73E8] hover:shadow-xl transition-all"
                  data-testid={`plan-card-${plan.name}`}
                >
                  <div className="text-center mb-6">
                    <div
                      className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: gradients[index] }}
                    >
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-[#1A73E8] mb-1">
                      {plan.price} ₽
                    </div>
                    <p className="text-[#7A7A7A] text-sm">
                      +{plan.communications} общений
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-[#1F1F1F]">
                      <Check className="w-5 h-5 text-[#34C759]" />
                      <span>Дополнительные знакомства</span>
                    </li>
                    <li className="flex items-center gap-2 text-[#1F1F1F]">
                      <Check className="w-5 h-5 text-[#34C759]" />
                      <span>Без ограничений</span>
                    </li>
                    <li className="flex items-center gap-2 text-[#1F1F1F]">
                      <Check className="w-5 h-5 text-[#34C759]" />
                      <span>Мгновенное пользование</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePurchase(plan.name)}
                    className="w-full py-6 rounded-full text-white font-semibold text-lg"
                    style={{ background: gradients[index] }}
                    data-testid={`purchase-${plan.name}-button`}
                  >
                    ОПЛАТИТЬ
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[#7A7A7A] text-sm mt-8">
            * Оплата через ЮKassa (мок)
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Subscriptions;
