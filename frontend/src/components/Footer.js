import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import api from '../lib/api';

const Footer = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const openDocument = async (docId) => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/${docId}`);
      setDocContent(response.data);
      setSelectedDoc(docId);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <footer className="bg-[#1F1F1F] text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} Speed Date. Все права защищены.
              </p>
            </div>
            
            <div className="flex gap-6">
              <button
                onClick={() => openDocument('requisites')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Реквизиты
              </button>
              <button
                onClick={() => openDocument('agreement')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Пользовательское соглашение
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Document Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold" style={{ color: '#1F1F1F' }}>
              {docContent?.title || 'Загрузка...'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-[#1A73E8] border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: docContent?.content || '' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
