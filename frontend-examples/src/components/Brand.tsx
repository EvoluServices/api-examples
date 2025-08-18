export interface Brand {
  label: string;
  value: string;
  images: string;
  type: 'credit' | 'debit';
}

export const brands: Brand[] = [
  // Crédito
  {
    label: 'Visa',
    value: 'VISA_CREDITO',
    images: '/images/visa.png',
    type: 'credit',
  },
  {
    label: 'Mastercard',
    value: 'MASTERCARD_CREDITO',
    images: '/images/mastercard.png',
    type: 'credit',
  },
  {
    label: 'Elo',
    value: 'ELO_CREDITO',
    images: '/images/elo.png',
    type: 'credit',
  },
  {
    label: 'Hipercard',
    value: 'HIPERCARD_CREDITO',
    images: '/images/hipercard.png',
    type: 'credit',
  },
  {
    label: 'American Express',
    value: 'AMEX_CREDITO',
    images: '/images/american-express.png',
    type: 'credit',
  },
  {
    label: 'Cabal',
    value: 'CABAL_CREDITO',
    images: '/images/cabal.png',
    type: 'credit',
  },
  {
    label: 'Sorocred',
    value: 'SOROCRED_CREDITO',
    images: '/images/sorocred.png',
    type: 'credit',
  },
  {
    label: 'Hiper',
    value: 'HIPER_CREDITO',
    images: '/images/hiper.png',
    type: 'credit',
  },
  {
    label: 'Banescard',
    value: 'BANESCARD_CREDITO',
    images: '/images/banescard.png',
    type: 'credit',
  },
  {
    label: 'Mais!',
    value: 'MAIS_CREDITO',
    images: '/images/mais.png',
    type: 'credit',
  },
  {
    label: 'Discover',
    value: 'DISCOVER_CREDITO',
    images: '/images/discover.png',
    type: 'credit',
  },
  {
    label: 'Diners Club',
    value: 'DINERS_CREDITO',
    images: '/images/diners.png',
    type: 'credit',
  },

  // Débito
  {
    label: 'Visa Débito',
    value: 'VISA_DEBITO',
    images: '/images/visa-electron.png',
    type: 'debit',
  },
  {
    label: 'Mastercard Débito',
    value: 'MASTERCARD_DEBITO',
    images: '/images/mastercard.png',
    type: 'debit',
  },
  {
    label: 'Elo Débito',
    value: 'ELO_DEBITO',
    images: '/images/elo.png',
    type: 'debit',
  },
  {
    label: 'Cabal Débito',
    value: 'CABAL_DEBITO',
    images: '/images/cabal.png',
    type: 'debit',
  },
  {
    label: 'Redeshop',
    value: 'REDESHOP_DEBITO',
    images: '/images/redeshop.png',
    type: 'debit',
  },
  {
    label: 'Sicredi',
    value: 'SICREDI_DEBITO',
    images: '/images/sicredi.png',
    type: 'debit',
  },
  {
    label: 'Sorocred Débito',
    value: 'SOROCRED_DEBITO',
    images: '/images/sorocred.png',
    type: 'debit',
  },
];
