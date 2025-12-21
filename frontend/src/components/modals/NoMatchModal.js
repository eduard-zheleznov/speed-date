import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

const NoMatchModal = ({ isOpen, onClose, onOpenFilters }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="no-match-modal">
        <DialogHeader>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5757] to-[#FF8E8E] flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center" style={{ color: '#1F1F1F' }}>
              Собеседник не найден
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 my-4">
          <p className="text-center text-[#7A7A7A] text-lg">
            Попробуйте изменить критерии поиска для нахождения собеседника
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                onClose();
                onOpenFilters();
              }}
              className="w-full py-6 rounded-full text-white font-semibold text-lg"
              style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
              data-testid="change-filters-button"
            >
              Изменить критерии
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-4 rounded-full"
              data-testid="close-no-match-button"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoMatchModal;
