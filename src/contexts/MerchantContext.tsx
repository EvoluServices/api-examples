import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

type MerchantInfo = {
    name: string;
    merchantKey: string;
    feeRate: number;
    splitEnabled: boolean;
    installmentRates?: { // 💰 tabela de taxas por bandeira e parcela
        [brand: string]: {
            [installments: string]: number;
        };
    };
} | null;


type MerchantContextType = {
    merchant: MerchantInfo;
    setMerchant: (info: MerchantInfo) => void;
    refreshMerchant: (identifier: string, password: string, integrationKey: string) => Promise<void>;
};

const MerchantContext = createContext<MerchantContextType>({
    merchant: null,
    setMerchant: () => {},
    refreshMerchant: async () => {},
});

export const MerchantProvider = ({ children }: { children: React.ReactNode }) => {
    const [merchant, setMerchant] = useState<MerchantInfo>(null);

    /**
     * 🔑 Busca as informações do estabelecimento (merchant)
     * usando as credenciais fornecidas na tela de Configurações.
     */
    const refreshMerchant = async (identifier: string, password: string, integrationKey: string) => {
        try {
            const { data } = await axios.get('/api/session/me', {
                headers: {
                    'x-api-identifier': identifier,
                    'x-api-password': password,
                    'x-integration-key': integrationKey,
                },
            });

            console.log('📡 Dados recebidos do backend:', data);

            setMerchant({
                name: data.merchantName,
                merchantKey: data.merchantKey,
                feeRate: data.feeRate ?? 0, // taxa geral
                splitEnabled: data.splitEnabled ?? false,
                installmentRates: data.installmentRates ?? {}, // tabela detalhada por bandeira/parcela
            });

        } catch (e) {
            console.error('❌ Erro ao buscar informações do merchant:', e);
            setMerchant(null);
        }
    };

    return (
        <MerchantContext.Provider value={{ merchant, setMerchant, refreshMerchant }}>
            {children}
        </MerchantContext.Provider>
    );
};

export const useMerchant = () => useContext(MerchantContext);
