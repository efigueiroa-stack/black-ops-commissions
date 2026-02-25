import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CheckCircle2, XCircle, RotateCcw, DollarSign } from 'lucide-react';

// Multi-Select Dropdown Component
const MultiSelect = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (opt) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(i => i !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    return (
        <div className="flex-1 min-w-[200px] relative">
            <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors cursor-pointer flex justify-between items-center"
            >
                <span className="truncate">
                    {selected.length === 0 ? "Todos selecionados" : `${selected.length} selecionado(s)`}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto p-2">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt)}
                                    onChange={() => toggleOption(opt)}
                                    className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold h-4 w-4"
                                />
                                <span className="text-xs text-[#0B1B2B]">{opt}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { data, updateCommissionStatus, loading, error, viewType } = useData();
    const [selectedDispute, setSelectedDispute] = useState(null); // ID of item being disputed
    const [activeTab, setActiveTab] = useState('statement'); // 'statement' or 'contested'

    // Filters State
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [repFilters, setRepFilters] = useState([]); // Array for multi-select
    const [leaderFilters, setLeaderFilters] = useState([]); // Array for multi-select
    const [qualifierFilters, setQualifierFilters] = useState([]); // Opps specific
    const [oppAfterMultipliersFilter, setOppAfterMultipliersFilter] = useState('all'); // Opps specific
    const [dealIdFilter, setDealIdFilter] = useState('');
    const [contestantFilter, setContestantFilter] = useState('all');

    // Filter and Sort - Primary source of truth for both metrics and table
    const userSales = useMemo(() => {
        if (!data) return [];

        let filtered = data
            .filter(sale => {
                // Deal ID Filter
                if (dealIdFilter && !String(sale.deal_id || '').toLowerCase().includes(dealIdFilter.toLowerCase())) return false;

                // Contestant Filter (primarily for contested tab)
                if (contestantFilter !== 'all' && sale.contestant !== contestantFilter) return false;

                // Shared Status Filter
                const status = (sale.status || '').trim();
                if (statusFilter === 'all') return true;
                return status === statusFilter.trim();
            })
            .filter(sale => {
                // Combined Field Filters based on ViewType
                if (viewType === 'opps') {
                    // Qualifier Filter
                    const qual = (sale.qualifier || '').trim();
                    if (qualifierFilters.length > 0 && !qualifierFilters.includes(qual)) return false;

                    // Leader (Qualificador) Filter
                    const leader = (sale.direct_leader_qualifier || '').trim();
                    if (leaderFilters.length > 0 && !leaderFilters.includes(leader)) return false;

                    // OPP após Multiplicadores Filter
                    if (oppAfterMultipliersFilter !== 'all') {
                        const val = sale.price_after_multipliers;
                        const numericValue = typeof val === 'string'
                            ? val.replace('R$', '').replace(/\./g, '').trim()
                            : String(val);
                        if (numericValue !== oppAfterMultipliersFilter) return false;
                    }
                } else {
                    // Representative Filter
                    const rep = (sale.representative || '').trim();
                    if (repFilters.length > 0 && !repFilters.includes(rep)) return false;
                    if (currentUser && currentUser !== 'G4 Education' && rep !== currentUser.trim()) return false;

                    // Leader (Direct) Filter
                    const leader = (sale.direct_leader || '').trim();
                    if (leaderFilters.length > 0 && !leaderFilters.includes(leader)) return false;

                    // Payment Method Filter
                    const pm = (sale.payment_method || '').trim();
                    if (paymentMethodFilter !== 'all') {
                        if (paymentMethodFilter === 'blank') {
                            if (pm && pm !== '') return false;
                        } else if (pm !== paymentMethodFilter.trim()) return false;
                    }
                }
                return true;
            });

        // Tab Specific Filtering
        if (activeTab === 'contested') {
            filtered = filtered.filter(sale => ['Disputed', 'Missing'].includes(sale.commission_status));
        }

        // Sorting (Always return a new array)
        return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data, currentUser, activeTab, statusFilter, paymentMethodFilter, repFilters, leaderFilters, qualifierFilters, oppAfterMultipliersFilter, viewType, dealIdFilter, contestantFilter]);

    // Extract Unique Filter Options
    const { statusOptions, paymentMethodOptions, repOptions, leaderOptions, qualifierOptions, oppAfterMultipliersOptions, contestantOptions } = useMemo(() => {
        if (!data) return { statusOptions: [], paymentMethodOptions: [], repOptions: [], leaderOptions: [], qualifierOptions: [], oppAfterMultipliersOptions: [], contestantOptions: [] };

        const reps = Array.from(new Set(data.map(s => s.representative).filter(Boolean)));
        const quals = Array.from(new Set(data.map(s => s.qualifier).filter(Boolean)));
        const allNames = Array.from(new Set([...reps, ...quals])).sort();

        return {
            statusOptions: Array.from(new Set(data.map(s => s.status).filter(Boolean))).sort(),
            paymentMethodOptions: Array.from(new Set(data.map(s => s.payment_method).filter(p => p && p.trim() !== ''))).sort(),
            repOptions: reps.sort(),
            leaderOptions: Array.from(new Set(data.map(s => viewType === 'opps' ? s.direct_leader_qualifier : s.direct_leader).filter(Boolean))).sort(),
            qualifierOptions: quals.sort(),
            oppAfterMultipliersOptions: Array.from(new Set(data.map(s => {
                if (viewType !== 'opps') return null;
                const val = s.price_after_multipliers;
                if (!val) return null;
                return typeof val === 'string' ? val.replace('R$', '').replace(/\./g, '').trim() : String(val);
            }).filter(Boolean))).sort((a, b) => {
                const valA = parseFloat(a.replace(',', '.'));
                const valB = parseFloat(b.replace(',', '.'));
                return valA - valB;
            }),
            contestantOptions: allNames
        };
    }, [data, viewType]);

    // Calculate Totals
    const totalRevenue = useMemo(() => {
        if (viewType === 'opps') {
            // "número de opps (soma da coluna Multiplicador da Opp)"
            return userSales.reduce((sum, sale) => sum + (Number(sale.multiplier_opp) || 0), 0);
        }
        return userSales.reduce((sum, sale) => sum + (Number(sale.value) || 0), 0);
    }, [userSales, viewType]);

    const totalRevenueWithMultipliers = useMemo(() => {
        return userSales.reduce((sum, sale) => {
            // Handle potential string formatting or raw numbers
            const field = viewType === 'opps' ? sale.price_after_multipliers : sale.price_after_multipliers;
            const val = typeof field === 'string'
                ? parseFloat(field.replace('R$', '').replace(/\./g, '').replace(',', '.'))
                : Number(field);

            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }, [userSales, viewType]);

    const pendingCount = userSales.filter(s => s.commission_status === 'Pending').length;

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
                setSelectedDispute(userSales.find(s => s.id === id));
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

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B1B2B]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                <p>Erro ao carregar dados: {error}</p>
            </div>
        );
    }

    return (
        <div className="font-sans text-[#0B1B2B]">
            {/* Header & Stats */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
                {/* Pending Count Card */}
                <div className="bg-white px-6 py-3 rounded-xl border border-gray-100 shadow-lg flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans mb-1">Itens Pendentes</p>
                    <p className="text-xl font-bold font-sans text-[#0B1B2B]">{pendingCount}</p>
                </div>

                {/* Revenue/Opp Count Card */}
                <div className="bg-white px-6 py-3 rounded-xl border border-gray-100 shadow-lg flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans mb-1">
                        {viewType === 'opps' ? 'Número de Opps' : 'Receita Gerada'}
                    </p>
                    <p className="text-xl font-bold font-sans text-[#0B1B2B]">
                        {viewType === 'opps'
                            ? totalRevenue
                            : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                    </p>
                </div>

                {/* Revenue/Opp with Multipliers Card */}
                <div className="bg-white px-6 py-3 rounded-xl border border-gray-100 shadow-lg flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans mb-1">
                        {viewType === 'opps' ? 'Opps após Multiplicadores' : 'Receita com Multiplicadores'}
                    </p>
                    <p className="text-xl font-bold font-sans text-[#0B1B2B]">
                        {viewType === 'opps'
                            ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(totalRevenueWithMultipliers)
                            : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenueWithMultipliers)}
                    </p>
                </div>

                {/* Falta Deal Button */}
                <button
                    onClick={() => setSelectedDispute({ type: 'missing' })}
                    className="bg-[#441B1B] text-white px-6 py-3 rounded-xl shadow-lg font-bold uppercase tracking-wider text-xs hover:bg-[#2d1212] transition-colors flex items-center justify-center gap-2 h-full w-full"
                >
                    ! Falta Deal
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('statement')}
                    className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'statement'
                        ? 'text-[#0B1B2B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#Cfba75]'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Extrato Geral
                </button>
                <button
                    onClick={() => setActiveTab('contested')}
                    className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'contested'
                        ? 'text-[#0B1B2B] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#Cfba75]'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Contestações
                </button>
            </div>

            {/* Filters Bar */}
            <div className={`bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-6 gap-4 items-end transition-all duration-300`}>
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

                {activeTab === 'contested' ? (
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">Contestador</label>
                        <select
                            value={contestantFilter}
                            onChange={(e) => setContestantFilter(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                        >
                            <option value="all">Todos os Contestadores</option>
                            {contestantOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <MultiSelect
                        label={viewType === 'opps' ? "Qualificador" : "Proprietário"}
                        options={viewType === 'opps' ? qualifierOptions : repOptions}
                        selected={viewType === 'opps' ? qualifierFilters : repFilters}
                        onChange={viewType === 'opps' ? setQualifierFilters : setRepFilters}
                    />
                )}

                <div className={`${activeTab === 'contested' ? 'opacity-50 pointer-events-none grayscale' : ''} grid grid-cols-1 md:grid-cols-3 gap-4 col-span-1 md:col-span-3 items-end`}>
                    <MultiSelect
                        label={viewType === 'opps' ? "Líder Direto do Qualificador" : "Líder Direto"}
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
                            {statusOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-1">
                            {viewType === 'opps' ? "OPP após Multiplicadores" : "Forma de Pagamento"}
                        </label>
                        {viewType === 'opps' ? (
                            <select
                                value={oppAfterMultipliersFilter}
                                onChange={(e) => setOppAfterMultipliersFilter(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                            >
                                <option value="all">Todos os Valores</option>
                                {oppAfterMultipliersOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-[#0B1B2B] focus:outline-none focus:border-brand-gold transition-colors appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E0' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                            >
                                <option value="all">Todas as Formas</option>
                                <option value="blank">(Em branco)</option>
                                {paymentMethodOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => {
                        setStatusFilter('all');
                        setPaymentMethodFilter('all');
                        setRepFilters([]);
                        setLeaderFilters([]);
                        setQualifierFilters([]);
                        setOppAfterMultipliersFilter('all');
                        setDealIdFilter('');
                        setContestantFilter('all');
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-[#0B1B2B] transition-colors flex items-center gap-2 h-[42px] justify-center"
                >
                    <RotateCcw size={14} /> Limpar
                </button>
            </div>

            {/* Main Statement Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-[#F8F9FA] text-[#0B1B2B] border-b border-gray-200">
                            {activeTab === 'contested' ? (
                                <tr>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Deal ID</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Contestador</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Categoria</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Descrição</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Devolutiva</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider w-40 text-center">Ação</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Deal ID</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">
                                        {viewType === 'opps' ? 'Qualificador' : 'Proprietário'}
                                    </th>
                                    {viewType === 'opps' && <th className="p-4 font-bold text-xs uppercase tracking-wider">Proprietário</th>}
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">Squad</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">
                                        {viewType === 'opps' ? 'Líder Direto do Qualificador' : 'Líder Direto'}
                                    </th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">
                                        {viewType === 'opps' ? 'Data Oportunidade' : 'Data de fechamento'}
                                    </th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider">
                                        {viewType === 'opps' ? 'Origem do Deal' : 'Nome do negócio'}
                                    </th>
                                    {viewType === 'opps' ? (
                                        <>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Status Reconhecimento</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Nome Deal</th>
                                        </>
                                    ) : (
                                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Produto</th>
                                    )}
                                    {viewType === 'opps' ? (
                                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Produto (Se vendido)</th>
                                    ) : (
                                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Valor</th>
                                    )}
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-center">Link</th>
                                    {viewType === 'opps' ? (
                                        <>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Opp</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Campanhas</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Final</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">OPP após Multiplicadores</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Forma de pagamento</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Nº de parcelas</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Status do Reconhecimento</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Pagamento</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Campanha</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Mult. Final</th>
                                            <th className="p-4 font-bold text-xs uppercase tracking-wider">Preço Final</th>
                                        </>
                                    )}
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider w-40 text-center">Ação</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {userSales.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-xs font-mono text-gray-500">{sale.deal_id}</td>

                                    {activeTab === 'contested' ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-4 text-xs text-[#0B1B2B]">
                                                {viewType === 'opps' ? sale.qualifier : sale.representative}
                                            </td>
                                            {viewType === 'opps' && <td className="p-4 text-xs text-[#0B1B2B]">{sale.representative}</td>}
                                            <td className="p-4 text-xs text-gray-500">{sale.squad}</td>
                                            <td className="p-4 text-xs text-gray-500">
                                                {viewType === 'opps' ? sale.direct_leader_qualifier : sale.direct_leader}
                                            </td>
                                            <td className="p-4 text-xs text-gray-500 font-mono">{sale.dateFormatted}</td>
                                            <td className="p-4 text-xs font-bold text-[#0B1B2B] max-w-[200px] truncate" title={sale.customer}>
                                                {viewType === 'opps' ? sale.deal_origin : sale.customer}
                                            </td>
                                            {viewType === 'opps' ? (
                                                <>
                                                    <td className="p-4 text-xs">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border
                                                          ${sale.status === 'Reconhecido Automático' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                                                        `}>
                                                            {sale.status === 'Reconhecido Automático' && <CheckCircle2 size={10} />}
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-[#0B1B2B] max-w-[200px] truncate" title={sale.customer}>
                                                        {sale.customer}
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="p-4 text-xs text-gray-600">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-medium uppercase">{sale.product}</span>
                                                </td>
                                            )}

                                            {viewType === 'opps' ? (
                                                <td className="p-4 text-xs text-gray-600">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-medium uppercase">{sale.product}</span>
                                                </td>
                                            ) : (
                                                <td className="p-4 text-xs font-medium text-[#0B1B2B] font-mono">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                                                </td>
                                            )}

                                            <td className="p-4 text-xs text-center">
                                                {sale.deal_link ? (
                                                    <a href={sale.deal_link} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Ver</a>
                                                ) : '-'}
                                            </td>

                                            {viewType === 'opps' ? (
                                                <>
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
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-4 text-xs text-gray-600">{sale.payment_method}</td>
                                                    <td className="p-4 text-xs text-gray-600 text-center">{sale.installments}</td>
                                                    <td className="p-4 text-xs">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border
                                                          ${sale.status === 'Reconhecido Automático' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}
                                                        `}>
                                                            {sale.status === 'Reconhecido Automático' && <CheckCircle2 size={10} />}
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs text-center font-mono text-gray-600">{sale.multiplier_payment}</td>
                                                    <td className="p-4 text-xs text-center font-mono text-gray-600">{sale.multiplier_campaign}</td>
                                                    <td className="p-4 text-xs text-center font-mono font-bold text-[#0B1B2B]">{sale.multiplier_final}</td>
                                                    <td className="p-4 text-xs font-bold text-[#0B1B2B] font-mono">
                                                        {sale.price_after_multipliers && !isNaN(parseFloat(String(sale.price_after_multipliers).replace('R$', '').replace(/\./g, '').replace(',', '.')))
                                                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(typeof sale.price_after_multipliers === 'string' ? sale.price_after_multipliers.replace('R$', '').replace(/\./g, '').replace(',', '.') : sale.price_after_multipliers))
                                                            : sale.price_after_multipliers}
                                                    </td>
                                                </>
                                            )}
                                        </>
                                    )}

                                    <td className="p-4">
                                        {sale.commission_status === 'Pending' ? (
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleAction(sale.id, 'validate')}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                    title="Validar"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(sale.id, 'dispute_open')}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Contestar"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                    ${sale.commission_status === 'Validated' ? 'bg-green-100 text-green-800' : ''}
                                                    ${sale.commission_status === 'Disputed' ? 'bg-red-100 text-red-800' : ''}
                                                    ${sale.commission_status === 'Missing' ? 'bg-orange-100 text-orange-800' : ''}
                                                `}>
                                                    {sale.commission_status === 'Validated' ? 'Validado' : sale.commission_status === 'Missing' ? 'Falta Deal' : 'Contestado'}
                                                </span>
                                                <button
                                                    onClick={() => handleAction(sale.id, 'reopen')}
                                                    className="text-[10px] items-center gap-1 text-gray-400 hover:text-[#0B1B2B] underline flex"
                                                >
                                                    <RotateCcw size={10} /> Reabrir
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {userSales.length === 0 && (
                                <tr>
                                    <td colSpan="14" className="p-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <RotateCcw className="opacity-20" size={48} />
                                            <p>Nenhuma venda encontrada para o período.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dispute Side Panel (Overlay) */}
            {selectedDispute && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-[#0B1B2B]/80 backdrop-blur-sm" onClick={() => setSelectedDispute(null)} />
                    <div className="absolute top-0 right-0 h-full w-[450px] bg-[#0B1B2B] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">

                        {/* Header */}
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#0B1B2B]">
                            <h3 className="font-serif text-2xl text-brand-gold font-bold">
                                {selectedDispute.type === 'missing' ? 'Falta Deal' : 'Contestar Venda'}
                            </h3>
                            <button onClick={() => setSelectedDispute(null)} className="text-white/50 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0B1B2B]">
                            {/* Info Card - Only for existing disputes */}
                            {selectedDispute.id && (
                                <div className="bg-white/5 border-l-4 border-brand-gold rounded-r-lg p-6 space-y-2">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">Cliente</p>
                                    <p className="text-white font-bold text-xl">{selectedDispute.customer}</p>

                                    <div className="flex justify-between pt-4 border-t border-white/10 mt-4">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase tracking-wider">Produto</p>
                                            <p className="text-white font-medium">{selectedDispute.product}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-400 text-xs uppercase tracking-wider">Valor</p>
                                            <p className="text-white font-mono text-lg font-bold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedDispute.value)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info Message for Missing Deal */}
                            {selectedDispute.type === 'missing' && (
                                <div className="bg-red-500/10 border-l-4 border-red-500 rounded-r-lg p-6">
                                    <p className="text-white text-sm">
                                        Informe os detalhes do deal que não consta no extrato.
                                    </p>
                                </div>
                            )}

                            {/* Form */}
                            <form id="dispute-form-react" onSubmit={handleDisputeSubmit} className="space-y-6">
                                {/* Deal ID for Missing */}
                                {selectedDispute.type === 'missing' && (
                                    <div className="space-y-2">
                                        <label className="block text-brand-gold text-xs font-bold uppercase tracking-wider">Deal ID <span className="text-red-500">*</span></label>
                                        <input
                                            name="missing_deal_id"
                                            type="text"
                                            required
                                            onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-colors"
                                            placeholder="Ex: 12345 (Somente números)"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-brand-gold text-xs font-bold uppercase tracking-wider">Nome de quem está realizando a contestação <span className="text-red-500">*</span></label>
                                    <select
                                        name="contestant"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-colors"
                                    >
                                        <option value="" disabled selected>Selecione...</option>
                                        {contestantOptions.map(name => (
                                            <option key={name} value={name} className="bg-[#0B1B2B]">{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-brand-gold text-xs font-bold uppercase tracking-wider">Categoria <span className="text-red-500">*</span></label>
                                    <select
                                        name="category"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-colors"
                                    >
                                        <option value="" disabled selected>Selecione...</option>
                                        <option value="Multiplicador errado" className="bg-[#0B1B2B]">Multiplicador errado</option>
                                        <option value="Sem forma de pagamento" className="bg-[#0B1B2B]">Sem forma de pagamento</option>
                                        <option value="Deal duplicado" className="bg-[#0B1B2B]">Deal duplicado</option>
                                        {selectedDispute.type === 'missing' && (
                                            <option value="Deal Faltando" className="bg-[#0B1B2B]" selected>Deal Faltando</option>
                                        )}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-brand-gold text-xs font-bold uppercase tracking-wider">Descrição <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="description"
                                        required
                                        rows="4"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-brand-gold focus:bg-white/10 transition-colors"
                                        placeholder="Descreva o problema com detalhes..."
                                    ></textarea>
                                </div>
                            </form>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 border-t border-white/10 flex gap-4 bg-[#0B1B2B] shadow-2xl">
                            <button
                                type="button"
                                onClick={() => setSelectedDispute(null)}
                                className="flex-1 py-4 px-6 rounded-lg border border-white/20 text-white font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="dispute-form-react"
                                className="flex-1 py-4 px-6 rounded-lg bg-brand-gold text-[#0B1B2B] font-bold uppercase tracking-wider hover:bg-[#E5C100] transition-colors shadow-lg shadow-brand-gold/20"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
