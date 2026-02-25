import React, { createContext, useContext, useState } from 'react';
import { fetchSalesData, updateSaleStatus } from '../services/api';
// import { mockSalesData } from '../data/mockData'; // Removed mock data import

const DataContext = createContext();

export function DataProvider({ children }) {
    const [data, setData] = useState([]); // Start empty
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentUrl, setCurrentUrl] = useState('https://n8n-comercial.g4educacao.com/webhook/extrato-de-vendas');
    const [viewType, setViewType] = useState('sales'); // 'sales' or 'opps'

    // Fetch data whenever URL changes
    const loadData = async (url = currentUrl) => {
        setLoading(true);
        try {
            const sales = await fetchSalesData(url);
            setData(sales);
            setCurrentUrl(url);

            // Detect view type based on URL
            if (url.includes('extrato-de-oportunidades')) {
                setViewType('opps');
            } else {
                setViewType('sales');
            }
        } catch (err) {
            setError(err.message);
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    // Derive representatives from data
    const representatives = React.useMemo(() => {
        const uniqueReps = new Set(data.map(item => item.representative).filter(Boolean));
        return Array.from(uniqueReps).sort();
    }, [data]);

    const updateCommissionStatus = async (id, newStatus, disputeDetails = null) => {
        try {
            // Optimistic update
            setData(prevData => prevData.map(item =>
                item.id === id ? { ...item, commission_status: newStatus, ...disputeDetails } : item
            ));

            // Only call API for Validated or Disputed
            if (newStatus === 'Validated' || newStatus === 'Disputed') {
                const itemToUpdate = data.find(item => item.id === id);
                if (itemToUpdate) {
                    await updateSaleStatus(itemToUpdate, newStatus, disputeDetails);
                }
            } else if (newStatus === 'Missing') {
                // For missing deals, we don't have an existing item ID.
                const newItem = {
                    id: `missing-${Date.now()}`,
                    deal_id: disputeDetails?.missing_deal_id || 'N/A',
                    representative: disputeDetails?.userName,
                    customer: 'Falta Deal',
                    product: '-',
                    value: 0,
                    date: new Date().toISOString(),
                    dateFormatted: new Date().toLocaleDateString('pt-BR'),
                    commission_status: 'Missing',
                    category: disputeDetails?.category,
                    description: disputeDetails?.description,
                    originalData: {}
                };
                setData(prev => [newItem, ...prev]);
                await updateSaleStatus(newItem, 'Missing', disputeDetails);
            }
        } catch (err) {
            // Revert on error
            // ... (reload data would be better)
            setError(err.message);
            throw err;
        }
    };

    return (
        <DataContext.Provider value={{
            data,
            loading,
            error,
            representatives,
            updateCommissionStatus,
            loadData,
            currentUrl,
            viewType
        }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);
