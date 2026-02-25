import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { fetchContestedData } from '../services/api';
import MetricCard from '../components/dashboard/MetricCard';

export default function ContestedItems() {
    const { currentUser } = useAuth();
    const { updateCommissionStatus } = useData();
    const navigate = useNavigate();

    const [contestedData, setContestedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters State
    const [dealIdFilter, setDealIdFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('all');
    const [leaderFilter, setLeaderFilter] = useState('all');

    // Fetch data from new webhook
    const loadContested = async () => {
        setLoading(true);
        try {
            const result = await fetchContestedData();
            setContestedData(result);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContested();
    }, []);

    // Filtering Logic
    const filteredDeals = useMemo(() => {
        return contestedData.filter(sale => {
            if (dealIdFilter && !String(sale.deal_id || '').toLowerCase().includes(dealIdFilter.toLowerCase())) return false;
            if (nameFilter !== 'all' && sale.nome !== nameFilter) return false;
            if (leaderFilter !== 'all' && sale.leader !== leaderFilter) return false;
            return true;
        });
    }, [contestedData, dealIdFilter, nameFilter, leaderFilter]);

    // Options for Filters
    const nameOptions = useMemo(() => {
        const names = Array.from(new Set(contestedData.map(s => s.nome).filter(Boolean)));
        return names.sort();
    }, [contestedData]);

    const leaderOptions = useMemo(() => {
        const leaders = Array.from(new Set(contestedData.map(s => s.leader).filter(Boolean)));
        return leaders.sort();
    }, [contestedData]);

    const handleReopen = async (id) => {
        if (window.confirm('Deseja reabrir este item?')) {
            try {
                await updateCommissionStatus(id, 'Pending');
                // Refresh list
                loadContested();
            } catch (err) {
                alert(`Erro ao reabrir: ${err.message}`);
            }
        }
    };

    if (loading) return <div className="p-8 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B2B]"></div></div>;
    if (error) return <div className="p-8 text-center text-red-600"><p>Erro ao carregar contestações: {error}</p></div>;

    return (
        <div className="font-sans text-[#0B1B2B]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Voltar"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-serif font-bold text-[#0B1B2B]">Contestações</h1>
                </div>
                <button
                    onClick={loadContested}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-all font-medium"
                >
                    <RotateCcw size={16} />
                    Atualizar Dados
                </button>
            </div>

            {/* Metrics */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                <MetricCard label="Total Contestados" value={filteredDeals.length} />
            </div>

            {/* Filters */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end transition-all duration-300">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">Deal ID</label>
                    <input
                        type="text"
                        value={dealIdFilter}
                        onChange={(e) => setDealIdFilter(e.target.value)}
                        placeholder="Filtrar por ID..."
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors shadow-sm"
                    />
                </div>

                <div className="flex-1 min-w-[180px]">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">Nome</label>
                    <select
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                        <option value="all">Todos os Nomes</option>
                        {nameOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[180px]">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">Líder</label>
                    <select
                        value={leaderFilter}
                        onChange={(e) => setLeaderFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                        <option value="all">Todos os Líderes</option>
                        {leaderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => {
                        setDealIdFilter('');
                        setNameFilter('all');
                        setLeaderFilter('all');
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-[#0B1B2B] transition-colors flex items-center gap-2 h-[42px] justify-center"
                >
                    <RotateCcw size={14} /> Limpar
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead className="bg-[#F8F9FA] text-[#0B1B2B] border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-32 whitespace-nowrap">Deal ID</th>
                                <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-44 whitespace-nowrap">Nome</th>
                                <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-36 whitespace-nowrap">Líder</th>
                                <th className="p-4 font-bold text-[10px] uppercase tracking-wider w-36 whitespace-nowrap">Categoria</th>
                                <th className="p-4 font-bold text-[10px] uppercase tracking-wider">Descrição</th>
                                <th className="p-4 font-bold text-[10px] uppercase tracking-wider">Devolutiva (Time comissionamento)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDeals.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-xs font-mono text-gray-500 whitespace-nowrap">{sale.deal_id}</td>
                                    <td className="p-4 text-xs text-[#0B1B2B] font-medium whitespace-nowrap">{sale.nome || '-'}</td>
                                    <td className="p-4 text-xs text-gray-500 font-medium whitespace-nowrap">{sale.leader || '-'}</td>
                                    <td className="p-4 text-xs text-[#0B1B2B] font-medium whitespace-nowrap">{sale.category}</td>
                                    <td className="p-4 text-xs text-gray-600 min-w-[250px] max-w-[400px]">
                                        <div className="break-words whitespace-normal leading-normal">
                                            {sale.description}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs min-w-[250px] max-w-[450px]">
                                        {sale.devolutiva ? (
                                            <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed break-words ${['Em análise', 'Em analise', 'Análise'].some(s => sale.devolutiva.toLowerCase().includes(s.toLowerCase()))
                                                ? 'bg-blue-50/50 text-blue-700 border-blue-100'
                                                : 'bg-green-50/50 text-green-700 border-green-100'
                                                }`}>
                                                {sale.devolutiva}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Pendente</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredDeals.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <RotateCcw className="opacity-20" size={48} />
                                            <p>Nenhuma contestação encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
