
export const fetchSalesData = async (url = 'https://n8n-comercial.g4educacao.com/webhook/extrato-de-vendas') => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-App-Client': 'g4_engineering',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const rawData = await response.json();

        // Unified mapping for both Sales and Opps schemas
        return rawData.map((item, index) => {
            // Support both "Data de fechamento" and "Data_oportunidade"
            const dateField = item['Data de fechamento'] || item['Data_oportunidade'];
            const [day, month, year] = dateField?.split('/') || [];
            const isoDate = (day && month && year) ? `${year}-${month}-${day}` : null;

            // Support both "Valor" and "OPP após multiplicadores" 
            const valueField = item['Valor'] !== undefined && item['Valor'] !== "" ? item['Valor'] : item['OPP após multiplicadores'];
            let numericValue = 0;
            if (valueField) {
                if (typeof valueField === 'string') {
                    // Remove currency formatting if present
                    const cleanValue = valueField.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                    numericValue = parseFloat(cleanValue) || 0;
                } else {
                    numericValue = valueField;
                }
            }

            return {
                // Ensure globally unique ID even if Deal ID is repeated
                id: `${item['Deal ID'] || 'item'}-${index}`,
                deal_id: item['Deal ID'],
                qualifier: (item['Qualificador'] || '').trim(),
                representative: (item['Proprietário'] || '').trim(),
                squad: (item['Squad'] || '').trim(),
                direct_leader: (item['Líder direto'] || '').trim(),
                direct_leader_qualifier: (item['Líder Direto do Qualificador'] || '').trim(),
                customer: (item['Nome do negócio'] || item['Nome_deal'] || '').trim(),
                product: (item['Produto'] || item['Produto (Se vendido)'] || 'Produto Desconhecido').trim(),
                value: numericValue || 0,
                date: isoDate || new Date().toISOString(),
                dateFormatted: dateField,
                deal_link: item['Link do deal'],
                payment_method: (item['Forma de pagamento'] || '').trim(),
                deal_origin: (item['origem_do_deal'] || '').trim(),
                installments: item['Nº de parcelas'],
                status_reconhecimento: (item['status_reconhecimento'] || '').trim(),
                multiplier_opp: item['Multiplicador da Opp'],
                multiplier_payment: item['Multiplicador Forma de Pagamento'],
                multiplier_campaign: item['Multiplicador de Campanhas'] || item['Multiplicador de campanha'],
                multiplier_final: item['Multiplicador Final'],
                price_after_multipliers: item['OPP após multiplicadores'] || item['Preço após multiplicadores'],
                status: (item['status_reconhecimento'] || 'Desconhecido').trim(),
                commission_status: 'Pending',
                originalData: item
            };
        });

    } catch (error) {
        console.error("Failed to fetch sales data:", error);
        throw error;
    }
};

export const fetchContestedData = async () => {
    try {
        const response = await fetch('https://n8n-comercial.g4educacao.com/webhook/contestacoes', {
            method: 'GET',
            headers: {
                'X-App-Client': 'g4_engineering',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const rawData = await response.json();

        return rawData.map((item, index) => {
            const getVal = (keyName) => {
                const foundKey = Object.keys(item).find(k => k.toLowerCase().trim() === keyName.toLowerCase());
                return foundKey ? item[foundKey] : '';
            };

            return {
                id: `contestation-${getVal('Deal ID') || index}-${index}`,
                deal_id: String(getVal('Deal ID')).trim(),
                leader: String(getVal('Líder') || getVal('Lider')).trim(),
                nome: String(getVal('Nome') || getVal('Nome do AE ou SDR')).trim(),
                category: String(getVal('Categoria')).trim(),
                description: String(getVal('Descrição') || getVal('Descricao')).trim(),
                devolutiva: String(getVal('Devolutiva (Time comissionamento)') || getVal('Devolutiva')).trim(),
                commission_status: 'Disputed'
            };
        });

    } catch (error) {
        console.error("Failed to fetch contested data:", error);
        throw error;
    }
};

export const updateSaleStatus = async (saleItem, newStatus, disputeDetails = null) => {
    try {
        const isDispute = newStatus === 'Disputed' || newStatus === 'contestado';
        const isMissing = newStatus === 'Missing' || newStatus === 'falta_deal';

        // Specific requirements for contestation/missing deal as per user curl
        if (isDispute || isMissing) {
            const payload = {
                "nome": disputeDetails?.contestant || saleItem.representative || "Eduardo",
                "devolutiva": "Em análise",
                "deal ID": (isMissing ? disputeDetails?.missing_deal_id : saleItem.deal_id) || "0",
                "valor": String(saleItem.value || 0),
                "descricao": disputeDetails?.description || "Teste de Contestar",
                "categoria": disputeDetails?.category || "Multiplicador errado"
            };

            const response = await fetch('https://n8n-comercial.g4educacao.com/webhook/validar-venda', {
                method: 'POST',
                headers: {
                    'X-App-Client': 'g4_engineering',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        }

        // Default logic for other statuses (e.g. Validated)
        const statusMap = {
            'Validated': 'validado',
            'Pending': 'pendente'
        };

        const mappedStatus = statusMap[newStatus] || newStatus;

        const payload = {
            ...saleItem.originalData,
            status: mappedStatus
        };

        const response = await fetch('https://n8n-comercial.g4educacao.com/webhook-test/validar-venda', {
            method: 'POST',
            headers: {
                'X-App-Client': 'g4_engineering',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Failed to update sale status:", error);
        throw error;
    }
};
