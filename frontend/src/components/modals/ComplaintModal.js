import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import api from '../../lib/api';

const ComplaintModal = ({ isOpen, onClose, reportedUserId }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/complaints', {
        reported_user_id: reportedUserId,
        reason: reason || undefined
      });
      
      toast.success('Жалоба отправлена');
      setReason('');
      onClose();
    } catch (error) {
      toast.error('Ошибка отправки жалобы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="complaint-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Пожаловаться
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Textarea
            placeholder="Укажите причину (необязательно)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            data-testid="complaint-reason-input"
          />

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              data-testid="complaint-cancel-button"
            >
              Отмена
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 text-white"
              style={{ background: 'linear-gradient(135deg, #FF5757 0%, #FF7B7B 100%)' }}
              data-testid="complaint-submit-button"
            >
              {loading ? 'Отправка...' : 'Пожаловаться'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintModal;
