import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, RefreshCw, LogOut, Loader2, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
// Restaurando o padrão de aliases @/ que é o padrão do seu projeto e resolve melhor os caminhos
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * EvolutionManager
 * Gerencia a conexão com a Evolution API (WhatsApp).
 */
export const EvolutionManager = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected' | 'connecting'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/evolution/status');
      const state = data.instance?.state || data.state;
      setStatus(state === 'open' ? 'connected' : 'disconnected');
    } catch (err) {
      console.error("Erro ao buscar status do WhatsApp:", err);
      setStatus('disconnected');
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      const { data } = await api.get('/evolution/connect');
      const code = data.base64 || data.qrcode?.base64;
      if (code) {
        setQrCode(code);
        setStatus('connecting');
      }
    } catch (err) {
      console.error("Erro ao gerar QR Code");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Deseja desconectar o WhatsApp? Isso interromperá os disparos automáticos.")) return;
    setLoading(true);
    try {
      await api.post('/evolution/logout');
      setStatus('disconnected');
      setQrCode(null);
      fetchStatus();
    } catch (err) {
      console.error("Erro ao desconectar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <Card className="overflow-hidden border-2 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            WhatsApp do Sistema
          </CardTitle>
          <CardDescription>
            Status da integração para envio de convites e mensagens.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              status === 'connected' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-red-100 text-red-700 border-red-200'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
              {status === 'connected' ? 'Online' : 'Offline'}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-6 w-full text-center lg:text-left">
            {status === 'connected' ? (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm text-left">
                <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-green-900">Conexão Estabelecida</p>
                  <p className="text-sm text-green-700">O sistema está pronto para realizar disparos automáticos.</p>
                </div>
              </div>
            ) : status === 'connecting' && qrCode ? (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm text-left">
                <QrCode className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-blue-900">Aguardando Escaneamento</p>
                  <p className="text-sm text-blue-700 font-medium">
                    Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código ao lado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
                <AlertCircle className="h-6 w-6 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-gray-700">Nenhum número conectado</p>
                  <p className="text-sm text-gray-500">Gere um QR Code para habilitar o envio de mensagens.</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {status !== 'connected' && !qrCode && (
                <Button 
                  onClick={handleConnect} 
                  disabled={loading} 
                  className="bg-primary hover:bg-primary/90 h-11 px-6 shadow-md transition-all active:scale-95"
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Smartphone className="mr-2 h-5 w-5" />}
                  Gerar QR Code
                </Button>
              )}
              
              {status === 'connected' && (
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-11 px-6 transition-all"
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  Desconectar WhatsApp
                </Button>
              )}

              {qrCode && (
                 <Button variant="ghost" className="h-11" onClick={() => { setQrCode(null); fetchStatus(); }}>
                   Cancelar
                 </Button>
              )}

              <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" onClick={fetchStatus} disabled={loading} title="Atualizar Status">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {qrCode && status !== 'connected' && (
            <div className="relative group p-2">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative bg-white p-4 rounded-xl shadow-2xl border flex flex-col items-center">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 lg:w-72 lg:h-72 object-contain transition-all" 
                />
                <div className="mt-4 flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Escaneie Agora</span>
                  <span className="text-[10px] text-gray-400 font-mono">CheckFacil Evolution API</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};