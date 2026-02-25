import React from 'react';

const MetricCard = ({ label, value, isCurrency = false, isPlainNumber = false }) => {
    const formattedValue = isCurrency
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
        : isPlainNumber
            ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)
            : value;

    return (
        <div className="bg-white px-6 py-3 rounded-xl border border-gray-100 shadow-lg flex flex-col justify-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-sans mb-1">{label}</p>
            <p className="text-xl font-bold font-sans text-[#0B1B2B]">{formattedValue}</p>
        </div>
    );
};

export default MetricCard;
