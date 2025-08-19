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
    images: '/brands/visa.png',
    type: 'credit',
  },
  {
    label: 'Mastercard',
    value: 'MASTERCARD_CREDITO',
    images: '/brands/mastercard.png',
    type: 'credit',
  },
  {
    label: 'Elo',
    value: 'ELO_CREDITO',
    images: '/brands/elo.png',
    type: 'credit',
  },
  {
    label: 'Hipercard',
    value: 'HIPERCARD_CREDITO',
    images: '/brands/hipercard.png',
    type: 'credit',
  },
  {
    label: 'American Express',
    value: 'AMEX_CREDITO',
    images: '/brands/american-express.png',
    type: 'credit',
  },
  {
    label: 'Cabal',
    value: 'CABAL_CREDITO',
    images: '/brands/cabal.png',
    type: 'credit',
  },
  {
    label: 'Sorocred',
    value: 'SOROCRED_CREDITO',
    images: '/brands/sorocred.png',
    type: 'credit',
  },
  {
    label: 'Hiper',
    value: 'HIPER_CREDITO',
    images: '/brands/hiper.png',
    type: 'credit',
  },
  {
    label: 'Banescard',
    value: 'BANESCARD_CREDITO',
    images: '/brands/banescard.png',
    type: 'credit',
  },
  {
    label: 'Mais!',
    value: 'MAIS_CREDITO',
    images: '/brands/mais.png',
    type: 'credit',
  },
  {
    label: 'Discover',
    value: 'DISCOVER_CREDITO',
    images: '/brands/discover.png',
    type: 'credit',
  },
  {
    label: 'Diners Club',
    value: 'DINERS_CREDITO',
    images: '/brands/diners.png',
    type: 'credit',
  },

  // Débito
  {
    label: 'Visa Débito',
    value: 'VISA_DEBITO',
    images: '/brands/visa-electron.png',
    type: 'debit',
  },
  {
    label: 'Mastercard Débito',
    value: 'MASTERCARD_DEBITO',
    images: '/brands/mastercard.png',
    type: 'debit',
  },
  {
    label: 'Elo Débito',
    value: 'ELO_DEBITO',
    images: '/brands/elo.png',
    type: 'debit',
  },
  {
    label: 'Cabal Débito',
    value: 'CABAL_DEBITO',
    images: '/brands/cabal.png',
    type: 'debit',
  },
  {
    label: 'Redeshop',
    value: 'REDESHOP_DEBITO',
    images: '/brands/redeshop.png',
    type: 'debit',
  },
  {
    label: 'Sicredi',
    value: 'SICREDI_DEBITO',
    images: '/brands/sicredi.png',
    type: 'debit',
  },
  {
    label: 'Sorocred Débito',
    value: 'SOROCRED_DEBITO',
    images: '/brands/sorocred.png',
    type: 'debit',
  },
];
