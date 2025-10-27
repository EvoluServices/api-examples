// src/components/Brand.tsx

export interface Brand {
    label: string;
    value: string;
    images: string;
    type: 'credit' | 'debit';
}

export const brands: Brand[] = [
    // --- Crédito ---
    {
        label: 'Visa',
        value: 'VISA_CREDITO',
        images: '/brands/visa.png',
        type: 'credit',
    },
    {
        label: 'MasterCard',
        value: 'MASTERCARD',
        images: '/brands/mastercard.png',
        type: 'credit',
    },
    {
        label: 'American Express',
        value: 'AMEX',
        images: '/brands/american-express.png',
        type: 'credit',
    },
    {
        label: 'Sorocred',
        value: 'SOROCRED',
        images: '/brands/sorocred.png',
        type: 'credit',
    },
    {
        label: 'Elo',
        value: 'ELO',
        images: '/brands/elo.png',
        type: 'credit',
    },
    {
        label: 'Sicred',
        value: 'SICREDI',
        images: '/brands/sicredi.png',
        type: 'credit',
    },
    {
        label: 'Agiplan',
        value: 'AGIPLAN',
        images: '/brands/agiplan.png',
        type: 'credit',
    },
    {
        label: 'Banescard',
        value: 'BANESCARD',
        images: '/brands/banescard.png',
        type: 'credit',
    },
    {
        label: 'CredZ',
        value: 'CREDZ',
        images: '/brands/credz.png',
        type: 'credit',
    },
    {
        label: 'JCB',
        value: 'JCB',
        images: '/brands/jcb.png',
        type: 'credit',
    },
    {
        label: 'Cabal',
        value: 'CABAL',
        images: '/brands/cabal.png',
        type: 'credit',
    },
    {
        label: 'Mais',
        value: 'MAIS',
        images: '/brands/mais.png',
        type: 'credit',
    },

    // --- Débito ---
    {
        label: 'Visa Electron (Débito)',
        value: 'VISA_ELECTRON',
        images: '/brands/visa-electron.png',
        type: 'debit',
    },
    {
        label: 'MasterCard Maestro (Débito)',
        value: 'MAESTRO',
        images: '/brands/maestro.png',
        type: 'debit',
    },
    {
        label: 'Elo Débito',
        value: 'ELO_DEBITO',
        images: '/brands/elo.png',
        type: 'debit',
    },
];
