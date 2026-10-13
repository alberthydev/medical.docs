import React, { useState } from 'react';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
  onShowNotice: (message: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onShowNotice }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
      onLoginSuccess(data.user);
    } catch (error) {
      onShowNotice(error instanceof Error ? error.message : 'Falha de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcf9f4] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#e5e2dd] shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <ShieldCheck className="w-12 h-12 mx-auto text-[#33694b]" />
          <h1 className="font-editorial text-2xl font-semibold text-[#0f2137]">MedicalDocs</h1>
          <p className="text-sm text-[#74777d]">Acesso seguro ao portal de auditoria</p>
        </div>
        <label className="block text-left text-xs font-semibold text-[#44474d]">
          Usuário
          <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" className="mt-1 w-full rounded-xl border border-[#d0cdc7] p-3 text-sm" required />
        </label>
        <label className="block text-left text-xs font-semibold text-[#44474d]">
          Senha
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-xl border border-[#d0cdc7] p-3 text-sm" required />
        </label>
        <button disabled={isLoading} className="w-full h-12 rounded-xl bg-[#0f2137] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
        </button>
        <a href="/api/auth/govbr" className="block text-center text-xs text-[#0f2137] underline">
          Entrar com gov.br
        </a>
        <p className="text-[11px] text-center text-[#74777d]">O acesso gov.br exige credenciais OAuth configuradas no servidor.</p>
      </form>
    </div>
  );
};
