import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Login() {
    const { login } = useAuth();
    const { representatives, loading, error, loadData } = useData();
    const navigate = useNavigate();

    const handleAction = async (type) => {
        const urls = {
            sales: 'https://n8n-comercial.g4educacao.com/webhook/extrato-de-vendas',
            opps: 'https://n8n-comercial.g4educacao.com/webhook/extrato-de-oportunidades'
        };

        login('G4 Education'); // Global user for all data access
        await loadData(urls[type]);
        navigate('/dashboard');
    };

    if (error) {
        return (
            <div className="flex flex-col h-screen font-sans justify-center items-center bg-[#0B1B2B] p-4 text-center">
                <h1 className="text-3xl text-red-500 font-bold mb-4">Erro ao carregar dados</h1>
                <p className="text-white mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="text-[#Cfba75] underline">Tentar novamente</button>
            </div>
        );
    }

    return (
        <div className="flex flex-row h-screen w-full overflow-hidden font-sans">
            {/* Left Side - Dark Navy */}
            <div className="w-1/2 bg-[#0B1B2B] flex flex-col justify-center items-center p-12 relative">
                <div className="flex flex-col items-center gap-2">
                    <div className="relative w-48 h-48">
                        <img src="../src/assets/logo.png" alt="G4 Logo" className="w-full h-full object-contain scale-150" />
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-white text-2xl tracking-wide mt-[-25px]">Commissions</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Action Buttons only */}
            <div className="w-1/2 bg-white flex flex-col justify-center items-center p-20 relative">
                <div className="absolute bottom-12 right-12 text-gray-200">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10z" />
                    </svg>
                </div>

                <div className="max-w-md w-full flex flex-col items-center space-y-12">
                    <h2 className="text-[#0B1B2B] text-2xl font-bold uppercase tracking-widest text-center">
                        Selecione o Extrato
                    </h2>

                    <div className="w-full flex flex-col gap-6">
                        <button
                            onClick={() => handleAction('sales')}
                            disabled={loading}
                            className="w-full py-8 px-6 bg-[#0B1B2B] text-white rounded-2xl text-xl font-bold uppercase tracking-widest hover:bg-[#1a2a3a] transition-all transform hover:scale-[1.02] shadow-2xl flex flex-col items-center gap-2 disabled:opacity-50"
                        >
                            <span>Acessar Extrato de Vendas</span>
                            <span className="text-xs opacity-50 font-normal">Acompanhe suas vendas e comissões</span>
                        </button>

                        <button
                            onClick={() => handleAction('opps')}
                            disabled={loading}
                            className="w-full py-8 px-6 border-4 border-[#0B1B2B] text-[#0B1B2B] rounded-2xl text-xl font-bold uppercase tracking-widest hover:bg-gray-50 transition-all transform hover:scale-[1.02] shadow-xl flex flex-col items-center gap-2 disabled:opacity-50"
                        >
                            <span>Acessar Extrato de Opps</span>
                            <span className="text-xs opacity-50 font-normal">Monitore oportunidades e funil</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}