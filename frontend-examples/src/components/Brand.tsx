export interface Bandeira {
  label: string;
  value: string;
  imagem: string;
  tipo: 'credito' | 'debito';
}

export const bandeiras: Bandeira[] = [
  // Crédito
  {
    label: 'Visa',
    value: 'VISA_CREDITO',
    imagem: '/imagens/visa.png',
    tipo: 'credito',
  },
  {
    label: 'Mastercard',
    value: 'MASTERCARD_CREDITO',
    imagem: '/imagens/mastercard.png',
    tipo: 'credito',
  },
  {
    label: 'Elo',
    value: 'ELO_CREDITO',
    imagem: '/imagens/elo.png',
    tipo: 'credito',
  },
  {
    label: 'Hipercard',
    value: 'HIPERCARD_CREDITO',
    imagem: '/imagens/hipercard.png',
    tipo: 'credito',
  },
  {
    label: 'American Express',
    value: 'AMEX_CREDITO',
    imagem: '/imagens/american-express.png',
    tipo: 'credito',
  },
  {
    label: 'Cabal',
    value: 'CABAL_CREDITO',
    imagem: '/imagens/cabal.png',
    tipo: 'credito',
  },
  {
    label: 'Sorocred',
    value: 'SOROCRED_CREDITO',
    imagem: '/imagens/sorocred.png',
    tipo: 'credito',
  },
  {
    label: 'Hiper',
    value: 'HIPER_CREDITO',
    imagem: '/imagens/hiper.png',
    tipo: 'credito',
  },
  {
    label: 'Banescard',
    value: 'BANESCARD_CREDITO',
    imagem: '/imagens/banescard.png',
    tipo: 'credito',
  },
  {
    label: 'Mais!',
    value: 'MAIS_CREDITO',
    imagem: '/imagens/mais.png',
    tipo: 'credito',
  },
  {
    label: 'Discover',
    value: 'DISCOVER_CREDITO',
    imagem: '/imagens/discover.png',
    tipo: 'credito',
  },
  {
    label: 'Diners Club',
    value: 'DINERS_CREDITO',
    imagem: '/imagens/diners.png',
    tipo: 'credito',
  },

  // Débito
  {
    label: 'Visa Débito',
    value: 'VISA_DEBITO',
    imagem: '/imagens/visa-electron.png',
    tipo: 'debito',
  },
  {
    label: 'Mastercard Débito',
    value: 'MASTERCARD_DEBITO',
    imagem: '/imagens/mastercard.png',
    tipo: 'debito',
  },
  {
    label: 'Elo Débito',
    value: 'ELO_DEBITO',
    imagem: '/imagens/elo.png',
    tipo: 'debito',
  },
  {
    label: 'Cabal Débito',
    value: 'CABAL_DEBITO',
    imagem: '/imagens/cabal.png',
    tipo: 'debito',
  },
  {
    label: 'Redeshop',
    value: 'REDESHOP_DEBITO',
    imagem: '/imagens/redeshop.png',
    tipo: 'debito',
  },
  {
    label: 'Sicredi',
    value: 'SICREDI_DEBITO',
    imagem: '/imagens/sicredi.png',
    tipo: 'debito',
  },
  {
    label: 'Sorocred Débito',
    value: 'SOROCRED_DEBITO',
    imagem: '/imagens/sorocred.png',
    tipo: 'debito',
  },
];
