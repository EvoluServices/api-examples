import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { brands } from '@/components/Brand';
import { useTransaction } from '@/contexts/TransactionContext';

export default function Pinpad() {
  const {
    amount,
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
  } = useTransaction();

  const amountFloat = parseFloat(amount || '0');

  const showInstallments = paymentType === 'credit';
  const showCustomerFields = paymentType === 'debit' || !!installments;
  const showSubmitButton = showCustomerFields;
  const filteredBrands = brands.filter((b) => b.type === paymentType);

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>

        {/* Payment Type + Brand + Installments */}
        <Box sx={{ display: 'flex', gap: 2 }}>

          {/* Payment Type */}
          <Box sx={{ width: '200px' }}>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-type-label">Modalidade</InputLabel>
              <Select
                  labelId="payment-type-label"
                  value={paymentType || ''}
                  label="Type"
                  onChange={(e) => {
                    setPaymentType(e.target.value);
                    setCardBrand('');
                    setInstallments('');
                    clearCustomerData();
                  }}
              >
                <MenuItem value="debit">Débito</MenuItem>
                <MenuItem value="credit">Crédito</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Card Brand */}
          {paymentType && (
              <Box sx={{ width: '200px' }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="card-brand-label">Bandeira</InputLabel>
                  <Select
                      labelId="card-brand-label"
                      value={cardBrand || ''}
                      label="Brand"
                      onChange={(e) => setCardBrand(e.target.value)}
                  >
                    {filteredBrands.map((b) => (
                        <MenuItem key={b.value} value={b.value}>
                          {b.label}
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
          )}

          {/* Installments */}
          {showInstallments && (
              <Box sx={{ width: '200px' }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="installments-label">Parcelamento</InputLabel>
                  <Select
                      labelId="installments-label"
                      value={installments}
                      label="Installments"
                      onChange={(e) => setInstallments(e.target.value)}
                  >
                    {[...Array(24)].map((_, i) => {
                      const count = i + 1;
                      const perInstallment = amountFloat / count;
                      return (
                          <MenuItem key={count} value={String(count)}>
                            {count}x of{' '}
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

        {/* Submit Button */}
        {showSubmitButton && (
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
