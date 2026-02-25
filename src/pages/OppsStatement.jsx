import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CheckCircle2, XCircle, RotateCcw, MessageSquare } from 'lucide-react';
import MultiSelect from '../components/dashboard/MultiSelect';
import MetricCard from '../components/dashboard/MetricCard';
import DisputeSidePanel from '../components/dashboard/DisputeSidePanel';

export default function OppsStatement() {
    const { currentUser } = useAuth();
    const { data, updateCommissionStatus, loading, error } = useData();
    const navigate = useNavigate();
    const [selectedDispute, setSelectedDispute] = useState(null);

    // Filters State
    const [statusFilter, setStatusFilter] = useState('all');
    const [qualifierFilters, setQualifierFilters] = useState([]);
    const [leaderFilters, setLeaderFilters] = useState([]);
    const [oppAfterMultipliersFilter, setOppAfterMultipliersFilter] = useState('all');
    const [dealIdFilter, setDealIdFilter] = useState('');

    // Filtering Logic
    const filteredOpps = useMemo(() => {
        if (!data) return [];
        return data.filter(sale => {
            if (dealIdFilter && !String(sale.deal_id || '').toLowerCase().includes(dealIdFilter.toLowerCase())) return false;

            const status = (sale.status || '').trim();
            if (statusFilter !== 'all' && status !== statusFilter.trim()) return false;

            const qual = (sale.qualifier || '').trim();
            if (qualifierFilters.length > 0 && !qualifierFilters.includes(qual)) return false;

            const leader = (sale.direct_leader_qualifier || '').trim();
            if (leaderFilters.length > 0 && !leaderFilters.includes(leader)) return false;

            if (oppAfterMultipliersFilter !== 'all') {
                const val = sale.price_after_multipliers;
                const numericValue = typeof val === 'string'
                    ? val.replace('R$', '').replace(/\./g, '').trim()
                    : String(val);
                if (numericValue !== oppAfterMultipliersFilter) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data, statusFilter, qualifierFilters, leaderFilters, oppAfterMultipliersFilter, dealIdFilter]);

    // Options for Filters
    const { statusOptions, qualifierOptions, leaderOptions, oppAfterMultipliersOptions, contestantOptions } = useMemo(() => {
        if (!data) return { statusOptions: [], qualifierOptions: [], leaderOptions: [], oppAfterMultipliersOptions: [], contestantOptions: [] };

        const reps = Array.from(new Set(data.map(s => s.representative).filter(Boolean))).sort();
        const quals = Array.from(new Set(data.map(s => s.qualifier).filter(Boolean))).sort();

        return {
            statusOptions: Array.from(new Set(data.map(s => s.status).filter(Boolean))).sort(),
            qualifierOptions: quals,
            leaderOptions: Array.from(new Set(data.map(s => s.direct_leader_qualifier).filter(Boolean))).sort(),
            oppAfterMultipliersOptions: Array.from(new Set(data.map(s => {
                const val = s.price_after_multipliers;
                if (!val) return null;
                return typeof val === 'string' ? val.replace('R$', '').replace(/\./g, '').trim() : String(val);
            }).filter(Boolean))).sort((a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.'))),
            contestantOptions: Array.from(new Set([...reps, ...quals])).sort()
        };
    }, [data]);

    // Metrics
    const totalOppsCount = useMemo(() => filteredOpps.reduce((sum, sale) => sum + (Number(sale.multiplier_opp) || 0), 0), [filteredOpps]);
    const totalOppsAfterMultipliers = useMemo(() => filteredOpps.reduce((sum, sale) => {
        const field = sale.price_after_multipliers;
        const val = typeof field === 'string'
            ? parseFloat(field.replace('R$', '').replace(/\./g, '').replace(',', '.'))
            : Number(field);
        return sum + (isNaN(val) ? 0 : val);
    }, 0), [filteredOpps]);
    const pendingCount = filteredOpps.filter(s => s.commission_status === 'Pending').length;

    const handleAction = async (id, action) => {
        try {
            if (action === 'validate') {
                if (window.confirm('Confirma a validação desta venda?')) {
                    await updateCommissionStatus(id, 'Validated');
                }
            } else if (action === 'reopen') {
                if (window.confirm('Deseja reabrir este item?')) {
                    await updateCommissionStatus(id, 'Pending');
                }
            } else if (action === 'dispute_open') {
                setSelectedDispute(filteredOpps.find(s => s.id === id));
            }
        } catch (err) {
            alert(`Erro na ação: ${err.message}`);
        }
    };

    const handleDisputeSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const disputeDetails = {
            contestant: formData.get('contestant'),
            category: formData.get('category'),
            description: formData.get('description'),
            missing_deal_id: formData.get('missing_deal_id') || null,
            userName: currentUser
        };

        try {
            if (selectedDispute.type === 'missing') {
                await updateCommissionStatus(null, 'Missing', disputeDetails);
            } else {
                await updateCommissionStatus(selectedDispute.id, 'Disputed', disputeDetails);
            }
            setSelectedDispute(null);
        } catch (err) {
            alert(`Erro ao contestar: ${err.message}`);
        }
    };

    if (loading) return <div className="p-8 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B2B]"></div></div>;
    if (error) return <div className="p-8 text-center text-red-600"><p>Erro ao carregar dados: {error}</p></div>;

    return (
        <div className="font-sans text-[#0B1B2B]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-[#0B1B2B]">Extrato de Opps</h1>
                <button
                    onClick={() => navigate('/contested')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#Cfba75] text-[#0B1B2B] rounded-lg font-bold text-sm hover:bg-[#Cfba75] hover:text-white transition-all shadow-sm"
                >
                    <MessageSquare size={18} />
                    Ver Minhas Contestações
                </button>
            </div>

            {/* Metrics */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                <MetricCard label="Itens Pendentes" value={pendingCount} />
                <MetricCard label="Número de Opps" value={totalOppsCount} />
                <MetricCard label="Opps após Multiplicadores" value={totalOppsAfterMultipliers} isPlainNumber />
                <button
                    onClick={() => setSelectedDispute({ type: 'missing' })}
                    className="bg-[#441B1B] text-white px-6 py-3 rounded-xl shadow-lg font-bold uppercase tracking-wider text-xs hover:bg-[#2d1212] transition-colors flex items-center justify-center gap-2 h-full w-full"
                >
                    ! Falta Deal
                </button>
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

                <MultiSelect
                    label="Qualificador"
                    options={qualifierOptions}
                    selected={qualifierFilters}
                    onChange={setQualifierFilters}
                />

                <MultiSelect
                    label="Líder Direto do Qualificador"
                    options={leaderOptions}
                    selected={leaderFilters}
                    onChange={setLeaderFilters}
                />

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">Status do Reconhecimento</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                        <option value="all">Todos os Status</option>
                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">OPP após Multiplicadores</label>
                    <select
                        value={oppAfterMultipliersFilter}
                        onChange={(e) => setOppAfterMultipliersFilter(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                    >
                        <option value="all">Todos os Valores</option>
                        {oppAfterMultipliersOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => {
                        setStatusFilter('all');
                        setQualifierFilters([]);
                        setLeaderFilters([]);
                        setOppAfterMultipliersFilter('all');
                        setDealIdFilter('');
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
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Qualificador</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Proprietário</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Squad</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Líder Direto do Qualificador</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Data Oportunidade</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Origem do Deal</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Status Reconhecimento</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Nome Deal</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Produto (Se vendido)</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider text-center">Link</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Opp</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Campanhas</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Final</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider">OPP após Multiplicadores</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-wider w-40 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOpps.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-xs font-mono text-gray-500">{sale.deal_id}</td>
                                    <td className="p-4 text-xs text-[#0B1B2B]">{sale.qualifier}</td>
                                    <td className="p-4 text-xs text-[#0B1B2B]">{sale.representative}</td>
                                    <td className="p-4 text-xs text-gray-500">{sale.squad}</td>
                                    <td className="p-4 text-xs text-gray-500">{sale.direct_leader_qualifier}</td>
                                    <td className="p-4 text-xs text-gray-500 font-mono">{sale.dateFormatted}</td>
                                    <td className="p-4 text-xs font-bold text-[#0B1B2B] max-w-[200px] truncate" title={sale.deal_origin}>{sale.deal_origin}</td>
                                    <td className="p-4 text-xs">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border
                                          ${sale.status === 'Reconhecido Automático' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                                        `}>
                                            {sale.status === 'Reconhecido Automático' && <CheckCircle2 size={10} />}
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-[#0B1B2B] max-w-[200px] truncate" title={sale.customer}>{sale.customer}</td>
                                    <td className="p-4 text-xs text-gray-600">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-medium uppercase">{sale.product}</span>
                                    </td>
                                    <td className="p-4 text-xs text-center">
                                        {sale.deal_link ? <a href={sale.deal_link} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Ver</a> : '-'}
                                    </td>
                                    <td className="p-4 text-xs text-center font-mono text-gray-600">{sale.multiplier_opp}</td>
                                    <td className="p-4 text-xs text-center font-mono text-gray-600">{sale.multiplier_campaign}</td>
                                    <td className="p-4 text-xs text-center font-mono font-bold text-[#0B1B2B]">{sale.multiplier_final}</td>
                                    <td className="p-4 text-xs font-bold text-[#0B1B2B] font-mono">
                                        {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(
                                            typeof sale.price_after_multipliers === 'string'
                                                ? parseFloat(sale.price_after_multipliers.replace('R$', '').replace(/\./g, '').replace(',', '.'))
                                                : sale.price_after_multipliers
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {sale.commission_status === 'Pending' ? (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => handleAction(sale.id, 'validate')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100" title="Validar"><CheckCircle2 size={16} /></button>
                                                <button onClick={() => handleAction(sale.id, 'dispute_open')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Contestar"><XCircle size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                    ${sale.commission_status === 'Validated' ? 'bg-green-100 text-green-800' : ''}
                                                    ${sale.commission_status === 'Disputed' ? 'bg-red-100 text-red-800' : ''}
                                                    ${sale.commission_status === 'Missing' ? 'bg-orange-100 text-orange-800' : ''}
                                                `}>{sale.commission_status === 'Validated' ? 'Validado' : sale.commission_status === 'Missing' ? 'Falta Deal' : 'Contestado'}</span>
                                                <button onClick={() => handleAction(sale.id, 'reopen')} className="text-[10px] items-center gap-1 text-gray-400 hover:text-[#0B1B2B] underline flex"><RotateCcw size={10} /> Reabrir</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DisputeSidePanel
                selectedDispute={selectedDispute}
                setSelectedDispute={setSelectedDispute}
                contestantOptions={contestantOptions}
                handleDisputeSubmit={handleDisputeSubmit}
            />
        </div>
    );
}
