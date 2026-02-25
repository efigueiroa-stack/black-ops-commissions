import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';

export default function ContestedItems() {
    const { currentUser } = useAuth();
    const { data, updateCommissionStatus, loading, error, viewType } = useData();
    const navigate = useNavigate();

    // Filters State
    const [dealIdFilter, setDealIdFilter] = useState('');
    const [contestantFilter, setContestantFilter] = useState('all');

    // Filtering Logic - Only items that are contested or missing
    const contestedDeals = useMemo(() => {
        if (!data) return [];
        return data.filter(sale => {
            // Only Disputed or Missing
            if (!['Disputed', 'Missing', 'contestado', 'falta_deal'].includes(sale.commission_status)) return false;

            if (dealIdFilter && !String(sale.deal_id || '').toLowerCase().includes(dealIdFilter.toLowerCase())) return false;
            if (contestantFilter !== 'all' && sale.contestant !== contestantFilter) return false;

            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data, dealIdFilter, contestantFilter]);

    // Options for Filters
    const contestantOptions = useMemo(() => {
        if (!data) return [];
        const reps = Array.from(new Set(data.map(s => s.representative).filter(Boolean)));
        const quals = Array.from(new Set(data.map(s => s.qualifier).filter(Boolean)));
        return Array.from(new Set([...reps, ...quals])).sort();
    }, [data]);

    const handleReopen = async (id) => {
        if (window.confirm('Deseja reabrir este item?')) {
            try {
                await updateCommissionStatus(id, 'Pending');
            } catch (err) {
                alert(`Erro ao reabrir: ${err.message}`);
            }
        }
    };

    if (loading) return <div className="p-8 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B2B]"></div></div>;
    if (error) return <div className="p-8 text-center text-red-600"><p>Erro ao carregar dados: {error}</p></div>;

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
            </div>

            {/* Metrics */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                <MetricCard label="Total Contestados" value={contestedDeals.length} />
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

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">Contestador</label>
                    <select
                        value={contestantFilter}
                        onChange={(e) => setContestantFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                        <option value="all">Todos os Contestadores</option>
                        {contestantOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => {
                        setDealIdFilter('');
                        setContestantFilter('all');
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-[#0B1B2B] transition-colors flex items-center gap-2 h-[42px] justify-center"
                >
                    <RotateCcw size={14} /> Limpar
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-[#F8F9FA] text-[#0B1B2B] border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Deal ID</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Contestador</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Categoria</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Descrição</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Devolutiva</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider w-40 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contestedDeals.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-xs font-mono text-gray-500">{sale.deal_id}</td>
                                    <td className="p-4 text-xs text-[#0B1B2B] font-medium">{sale.contestant || '-'}</td>
                                    <td className="p-4 text-xs text-[#0B1B2B] font-medium">{sale.category}</td>
                                    <td className="p-4 text-xs text-gray-600 max-w-[300px] truncate" title={sale.description}>
                                        {sale.description}
                                    </td>
                                    <td className="p-4 text-xs">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium border border-blue-100">
                                            Em desenvolvimento
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                ${sale.commission_status === 'Disputed' || sale.commission_status === 'contestado' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                                            `}>
                                                {sale.commission_status === 'Missing' || sale.commission_status === 'falta_deal' ? 'Falta Deal' : 'Contestado'}
                                            </span>
                                            <button
                                                onClick={() => handleReopen(sale.id)}
                                                className="text-[10px] items-center gap-1 text-gray-400 hover:text-[#0B1B2B] underline flex"
                                            >
                                                <RotateCcw size={10} /> Reabrir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {contestedDeals.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-gray-400">
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
