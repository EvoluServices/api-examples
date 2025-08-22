'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface TransactionContextProps {
    amount: string;
    setAmount: (v: string) => void;
    paymentType: string | null;
    setPaymentType: (v: string | null) => void;
    cardBrand: string | null;
    setCardBrand: (v: string | null) => void;
    installments: string;
    setInstallments: (v: string) => void;
    customerName: string;
    setCustomerName: (v: string) => void;
    customerDocument: string;
    setCustomerDocument: (v: string) => void;
    customerPhone: string;
    setCustomerPhone: (v: string) => void;
    customerEmail: string;
    setCustomerEmail: (v: string) => void;
    clearCustomerData: () => void;
    resetTransaction: () => void;
}

const TransactionContext = createContext({} as TransactionContextProps);

export const useTransaction = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState<string | null>(null);
    const [cardBrand, setCardBrand] = useState<string | null>(null);
    const [installments, setInstallments] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerDocument, setCustomerDocument] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    const clearCustomerData = () => {
        setCustomerName('');
        setCustomerDocument('');
        setCustomerPhone('');
        setCustomerEmail('');
    };

    const resetTransaction = () => {
        setAmount('');
        setPaymentType('');
        setCardBrand('');
        setInstallments('');
        clearCustomerData();
    };

    return (
        <TransactionContext.Provider
            value={{
                amount,
                setAmount,
                paymentType,
                setPaymentType,
                cardBrand,
                setCardBrand,
                installments,
                setInstallments,
                customerName,
                setCustomerName,
                customerDocument,
                setCustomerDocument,
                customerPhone,
                setCustomerPhone,
                customerEmail,
                setCustomerEmail,
                clearCustomerData,
                resetTransaction
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};
