'use client';

import { useState } from 'react';
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

  const [touchedName, setTouchedName] = useState(false);
  const [touchedDocument, setTouchedDocument] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

  const regexDocument = /^(\d{11}|\d{14})$/;
  const regexPhone = /^\d{11}$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = () => {
    let valid = true;
    if (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName)) valid = false;
    if (!regexDocument.test(customerDocument.replace(/\D/g, ''))) valid = false;
    if (!regexPhone.test(customerPhone.replace(/\D/g, ''))) valid = false;
    if (!regexEmail.test(customerEmail)) valid = false;

    if (!valid) {
      alert('Preencha todos os campos corretamente antes de finalizar.');
      return;
    }
    alert('Finalizado com sucesso!');
  };

  // Funções para aplicar máscara manual
  const maskDocument = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
        d ? `${a}.${b}.${c}-${d}` : `${a}.${b}.${c}`
      );
    } else {
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
        (_, a, b, c, d, e) => (e ? `${a}.${b}.${c}/${d}-${e}` : `${a}.${b}.${c}/${d}`)
      );
    }
  };

  const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, (_, a, b, c, d) =>
      d ? `(${a}) ${b} ${c}-${d}` : `(${a}) ${b} ${c}`
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      {/* Payment Type + Brand + Installments */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ width: '100px' }}>
          <FormControl fullWidth>
            <InputLabel id="payment-type-label">Função</InputLabel>
            <Select
              sx={{bgcolor:'#fff'}}
              labelId="payment-type-label"
              value={paymentType || ''}
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

        {paymentType && (
          <Box sx={{ width: '195px' }}>
            <FormControl fullWidth >
              <InputLabel id="card-brand-label">Bandeira</InputLabel>
              <Select
                sx={{bgcolor:'#fff'}}
                labelId="card-brand-label"
                value={cardBrand || ''}
                onChange={(e) => setCardBrand(e.target.value)}
              >
                {filteredBrands.map((b) => (
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

        {showInstallments && (
          <Box sx={{ width: '175px' }}>
            <FormControl fullWidth>
              <InputLabel id="installments-label">Parcelamento</InputLabel>
              <Select
                sx={{bgcolor:'#fff'}}
                labelId="installments-label"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              >
                {[...Array(24)].map((_, i) => {
                  const count = i + 1;
                  const perInstallment = amountFloat / count;
                  return (
                    <MenuItem key={count} value={String(count)}>
                      {count}x de{' '}
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

      {showCustomerFields && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '500px' }}>
          <TextField
            label="Nome"            
            sx={{ backgroundColor: '#FFF' }}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onBlur={() => setTouchedName(true)}
            error={touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))}
            helperText={
              touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))
                ? 'Informe um nome válido (apenas letras)'
                : ''
            }
          />

          <TextField
            label="Documento"     
            sx={{bgcolor:'#fff'}}       
            value={customerDocument}
            onChange={(e) => setCustomerDocument(maskDocument(e.target.value))}
            onBlur={() => setTouchedDocument(true)}
            error={touchedDocument && !regexDocument.test(customerDocument.replace(/\D/g, ''))}
            helperText={null}
          />

          <TextField
            label="Telefone"   
            sx={{bgcolor:'#fff'}}         
            value={customerPhone}
            onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
            onBlur={() => setTouchedPhone(true)}
            error={touchedPhone && !regexPhone.test(customerPhone.replace(/\D/g, ''))}
            helperText={null}
          />

          <TextField
            label="Email"  
            sx={{bgcolor:'#fff'}}          
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            onBlur={() => setTouchedEmail(true)}
            error={touchedEmail && !regexEmail.test(customerEmail)}
            helperText={null}
          />
        </Box>
      )}

      {showSubmitButton && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            sx={{
              borderRadius: '16px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              backgroundColor: '#FFF',
              color: '#0071EB',
              minWidth: '120px',
              boxShadow: 'none',
              border: '1px solid #ccc',
            }}
            onClick={clearCustomerData}
          >
            Limpar
          </Button>

          <Button
            variant="contained"
            sx={{
              minWidth: '365px', 
              backgroundColor: '#0071EB',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '16px',
              textTransform: 'none',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              paddingY: '10px',
              '&:hover': { backgroundColor: '#0071EB' },
            }}
            onClick={handleSubmit}
          >
            Finalizar
          </Button>
        </Box>
      )}
    </Box>
  );
}
