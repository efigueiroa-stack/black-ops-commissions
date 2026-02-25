import React, { useState } from 'react';

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

export default MultiSelect;
