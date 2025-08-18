'use client';

import Navbar from '@/components/Navbar';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default function Layout({ children }: Props) {
    return (
        <TransactionProvider>
            <Navbar
                pages={[
                    { href: '/transactions', name: 'Nova Venda' },
                    { href: '/config', name: 'Configurações' },
                ]}
            />
            {children}
        </TransactionProvider>
    );
}
