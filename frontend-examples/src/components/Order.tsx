import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { useTransaction } from '@/contexts/TransactionContext';
import { brands } from './Brand';

export default function Order() {
  const {
    amount,
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
  } = useTransaction();

  const amountFloat = parseFloat(amount || '0');
  const showBrand = !!amount;
  const showInstallments = showBrand && !!cardBrand;
  const showCustomerFields = showInstallments && !!installments;

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Card Brand */}
          {showBrand && (
              <Box sx={{ width: '50%' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Card Brand</InputLabel>
                  <Select
                      value={cardBrand || ''}
                      onChange={(e) => setCardBrand(e.target.value)}
                  >
                    {brands.map((b) => (
                        <MenuItem key={b.value} value={b.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src={b.images}
                                alt={b.label}
                                style={{ width: 24, height: 16, marginRight: 8 }}
                            />
                            {b.label}
                          </Box>
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
          )}

          {/* Installments */}
          {showInstallments && (
              <Box sx={{ width: '50%' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Installments</InputLabel>
                  <Select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                  >
                    {[...Array(24)].map((_, i) => {
                      const n = i + 1;
                      const perInstallment = amountFloat / n;
                      return (
                          <MenuItem key={n} value={String(n)}>
                            {n}x of{' '}
                            {perInstallment.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>
          )}
        </Box>

        {/* Customer Info */}
        {showCustomerFields && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '600px' }}>
              <TextField
                  label="Nome"
                  size="small"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
              />
              <TextField
                  label="Documento"
                  size="small"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
              />
              <TextField
                  label="Telefone"
                  size="small"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <TextField
                  label="Email"
                  size="small"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </Box>
        )}

        {showCustomerFields && (
            <Box sx={{ mt: 2 }}>
              <Button
                  variant="contained"
                  sx={{
                    borderRadius: '30px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    backgroundColor: '#004e93',
                    '&:hover': { backgroundColor: '#0056a6' },
                  }}
              >
                Finalizar
              </Button>
            </Box>
        )}
      </Box>
  );
}
