import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, RefreshCw, Loader2 } from 'lucide-react';
import api from '@/services/api';

/**
 * WhatsAppStatusIndicator
 * Componente para exibição simplificada do status da Evolution API na Dashboard.
 * Não possui funções de conexão/desconexão, apenas leitura.
 */
export function WhatsAppStatusIndicator() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/evolution/status');
      const state = data.instance?.state || data.state;
      setStatus(state === 'open' ? 'connected' : 'disconnected');
    } catch (err) {
      console.error("Erro ao buscar status do WhatsApp:", err);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Atualiza o status automaticamente a cada 2 minutos
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
      status === 'connected' 
        ? 'bg-green-50/50 border-green-100' 
        : 'bg-red-50/50 border-red-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          status === 'connected' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          <Smartphone size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            WhatsApp do Sistema
            {status === 'loading' ? (
              <Loader2 size={12} className="animate-spin text-slate-400" />
            ) : (
              <div className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            )}
          </h4>
          <p className="text-xs text-slate-500">
            {status === 'connected' 
              ? 'Integração ativa e pronta para disparos.' 
              : 'O sistema está offline. Conecte-se pelo menu lateral.'}
          </p>
        </div>
      </div>

      <button 
        onClick={fetchStatus} 
        disabled={loading}
        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-primary disabled:opacity-50 outline-none"
        title="Atualizar status"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}