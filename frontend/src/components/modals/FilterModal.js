import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

const FilterModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleOpenFilters = () => {
    onClose();
    navigate('/filters');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="filter-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center" style={{ color: '#1F1F1F' }}>
            Фильтры поиска
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-6">
          <p className="text-center text-[#7A7A7A]">
            Настройте фильтры для более точного<br />подбора собеседников
          </p>

          <Button
            onClick={handleOpenFilters}
            className="w-full py-6 rounded-full text-white font-semibold text-lg"
            style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #6A9EFF 100%)' }}
            data-testid="open-filters-button"
          >
            ОТКРЫТЬ ФИЛЬТРЫ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
