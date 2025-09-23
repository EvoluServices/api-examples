import { Typography, Box } from '@mui/material';
import React from 'react';

type ProductKey = 'order' | 'pinpad' | 'pos';

type Props = {
    product: ProductKey | null;
};

const EmptyStateMessage: React.FC<Props> = ({ product }) => {
    if (!product) return null;

    const messages: Record<ProductKey, React.ReactNode> = {
        order: (
            <>
                Preencha os dados e clique em <strong>Finalizar</strong> para gerar o link de pagamento.
            </>
        ),
        pinpad: (
            <>
                Preencha os dados e clique em <strong>Finalizar</strong> para iniciar a cobrança no Pinpad.
            </>
        ),
        pos: (
            <>
                Preencha os dados e clique em <strong>Finalizar</strong> para enviar a cobrança ao POS.
            </>
        ),
    };

    return (
        <Typography sx={{ color: '#6b7280' }}>
            {messages[product]}
        </Typography>
    );
};

export default EmptyStateMessage;
