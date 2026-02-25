import React from 'react';
import { XCircle } from 'lucide-react';

const DisputeSidePanel = ({ selectedDispute, setSelectedDispute, contestantOptions, handleDisputeSubmit }) => {
    if (!selectedDispute) return null;

    return (
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
                    {selectedDispute.id && !selectedDispute.type && (
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
    );
};

export default DisputeSidePanel;
