import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

const DecisionModal = ({ isOpen, onClose, onDecision }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="decision-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Хотите продолжить<br />общаться в чате?
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mt-6">
          <Button
            onClick={() => onDecision(true)}
            className="flex-1 py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #34C759 0%, #5DD97C 100%)' }}
            data-testid="decision-yes-button"
          >
            ДА
          </Button>
          
          <Button
            onClick={() => onDecision(false)}
            className="flex-1 py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #FF5757 0%, #FF7B7B 100%)' }}
            data-testid="decision-no-button"
          >
            НЕТ
          </Button>
        </div>

        <p className="text-center text-[#7A7A7A] text-sm mt-4">
          У вас есть 1 минута для принятия решения
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionModal;
