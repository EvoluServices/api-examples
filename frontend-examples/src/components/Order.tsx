'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  AlertColor,
} from '@mui/material';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useTransaction } from '@/contexts/TransactionContext';
import { brands } from './Brand';
import GenericErrorResult from './GenericErrorResult';
import RejectedResult from './RejectedResult';
import SuccessResult from './SuccessResult';

// Regex globais
const regexDocument = /^(\d{11}|\d{14})$/; // CPF 11 dígitos ou CNPJ 14 dígitos
const regexPhone = /^\d{11}$/; // Telefone com DDD + 9 + número
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const creditBrands = brands.filter((b) => b.type === 'credit');
  const [orderResult, setOrderResult] = useState<{ payUrl: string; uuid: string } | null>(null);

  // flags para exibir erro apenas após blur
  const [touchedName, setTouchedName] = useState(false);
  const [touchedDocument, setTouchedDocument] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: 'error' as AlertColor,
    title: '',
    description: '',
  });

  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const fetchOrderStatus = async (uuid: string) => {
    const configCookie = Cookies.get('api-examples-config');
    if (!configCookie) throw new Error('Configuração não encontrada.');

    const parsedConfig = JSON.parse(configCookie);
    const { url, values } = parsedConfig;
    const credentials = btoa(`${values.apiKey}:${values.apiSecret}`);

    const response = await axios.get(`${url}/api/orders/${uuid}`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  };

  useEffect(() => {
    if (!orderResult?.uuid || orderStatus === 'APPROVED') return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchOrderStatus(orderResult.uuid);
        const status = data.status;

        if (status === 'APPROVED') {
          setOrderStatus('APPROVED');
          clearInterval(interval);
        } else {
          setElapsedTime((prev) => {
            const newTime = prev + 30;
            if (newTime >= 300) clearInterval(interval);
            return newTime;
          });
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [orderResult?.uuid, elapsedTime, orderStatus]);

  const handleSubmit = async () => {
    if (!regexDocument.test(customerDocument.replace(/\D/g, ''))) {
      setSnackbar({
        open: true,
        severity: 'error',
        title: 'Documento inválido',
        description: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).',
      });
      return;
    }

    if (!regexPhone.test(customerPhone.replace(/\D/g, ''))) {
      setSnackbar({
        open: true,
        severity: 'error',
        title: 'Telefone inválido',
        description: 'Informe o telefone com 11 dígitos, incluindo DDD e nono dígito.',
      });
      return;
    }

    if (!regexEmail.test(customerEmail)) {
      setSnackbar({
        open: true,
        severity: 'error',
        title: 'E-mail inválido',
        description: 'Informe um e-mail válido.',
      });
      return;
    }

    try {
      const configCookie = Cookies.get('api-examples-config');
      if (!configCookie) throw new Error('Configuração não encontrada.');

      const parsedConfig = JSON.parse(configCookie);
      const { url, values } = parsedConfig;
      const credentials = btoa(`${values.apiKey}:${values.apiSecret}`);

      const response = await axios.post(
        `${url}/api/orders`,
        {
          order: {
            reference: '123CLIENTS',
            amount: String(Number(amountFloat.toFixed(2)) * 100),
            maxInstallments: installments,
            minInstallments: installments,
            merchantCode: values.merchantKey,
            customerName,
            customerDocument: customerDocument.replace(/\D/g, ''),
            description: 'Venda de equipamento',
            recurrent: false,
          },
        },
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { payUrl, uuid } = response.data;
      setOrderResult({ payUrl, uuid });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao criar pedido. Verifique os dados.');
    }
  };

  // Funções de formatação
  function formatDocumento(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
        d ? `${a}.${b}.${c}-${d}` : `${a}.${b}${c ? '.' + c : ''}`
      );
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, d, e) =>
      e ? `${a}.${b}.${c}/${d}-${e}` : `${a}.${b}.${c}/${d}`
    );
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
      c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 2 }}>
      {/* Coluna esquerda */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Bandeira + Parcelamento */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          {showBrand && (
            <Box sx={{ width: '50%', minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Bandeiras</InputLabel>
                <Select
                  value={cardBrand || ''}
                  onChange={(e) => setCardBrand(e.target.value)}
                  sx={{ backgroundColor: '#fff' }}
                >
                  {creditBrands.map((b) => (
                    <MenuItem key={b.value} value={b.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img src={b.images} alt={b.label} style={{ width: 24, height: 16, marginRight: 8 }} />
                        {b.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {showInstallments && (
            <Box sx={{ width: '50%', minWidth: 200 }}>
              <FormControl fullWidth>
                <InputLabel>Parcelamento</InputLabel>
                <Select
                  value={installments}
                  sx={{ backgroundColor: '#fff' }}
                  onChange={(e) => setInstallments(e.target.value)}
                >
                  {[...Array(24)].map((_, i) => {
                    const n = i + 1;
                    const perInstallment = amountFloat / n;
                    return (
                      <MenuItem key={n} value={String(n)}>
                        {n}x de{' '}
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

        {/* Campos do cliente */}
        {showCustomerFields && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 500 }}>
            <TextField
              label="Nome"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onBlur={() => setTouchedName(true)}
              sx={{ backgroundColor: '#FFF' }}
              error={touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))}
              helperText={
                touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))
                  ? 'Informe um nome válido (apenas letras)'
                  : ''
              }
            />

            <TextField
              label="Documento"
              value={customerDocument}
              onChange={(e) => setCustomerDocument(formatDocumento(e.target.value))}
              onBlur={() => setTouchedDocument(true)}
              sx={{ backgroundColor: '#FFF' }}
              error={touchedDocument && !regexDocument.test(customerDocument.replace(/\D/g, ''))}
              helperText={
                touchedDocument && !regexDocument.test(customerDocument.replace(/\D/g, ''))
                  ? 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)'
                  : ''
              }
            />

            <TextField
              label="Telefone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
              onBlur={() => setTouchedPhone(true)}
              sx={{ backgroundColor: '#FFF' }}
              error={touchedPhone && !regexPhone.test(customerPhone.replace(/\D/g, ''))}
              helperText={
                touchedPhone && !regexPhone.test(customerPhone.replace(/\D/g, ''))
                  ? 'Telefone deve ter 11 dígitos (DDD + 9 + número)'
                  : ''
              }
            />

            <TextField
              label="Email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              onBlur={() => setTouchedEmail(true)}
              sx={{ backgroundColor: '#FFF' }}
              error={touchedEmail && !regexEmail.test(customerEmail)}
              helperText={touchedEmail && !regexEmail.test(customerEmail) ? 'Informe um e-mail válido' : ''}
            />
          </Box>
        )}

        {/* Botões */}
        {showCustomerFields && (
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
              onClick={() => {
                setCustomerName('');
                setCustomerDocument('');
                setCustomerPhone('');
                setCustomerEmail('');
                setTouchedName(false);
                setTouchedDocument(false);
                setTouchedPhone(false);
                setTouchedEmail(false);
              }}
            >
              Limpar
            </Button>

            <Button
              variant="contained"
              sx={{
                flex: 1,
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

      {/* Resultado da direita */}
      {orderResult && (
        <Box sx={{ ml: 20, height: 'fit-content', alignSelf: 'flex-start' }}>
          {(() => {
            switch (orderStatus) {
              case 'APPROVED':
                return <SuccessResult customerName={customerName} amount={amountFloat} installments={installments} customerDocument={''} payment={0} />;
              case 'DISAPPROVED':
                return <RejectedResult />;
              case 'PENDING':
              case 'ABORTED':
                return (
                  <>
                    <Typography variant="h5" sx={{ color: '#204986', fontWeight: 700 }} gutterBottom>
                      Venda Criada com Sucesso
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#5a646e', lineHeight: '24px', fontWeight: 700, mb: 2 }}
                      gutterBottom
                    >
                      Para realizar o pagamento, disponibilize o link abaixo ao cliente:
                    </Typography>
                    {orderResult.payUrl && (
                      <Button
                        variant="contained"
                        color="primary"
                        href={orderResult.payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          backgroundColor: '#0071EB',
                          color: '#FFF',
                          fontWeight: 700,
                          fontSize: '16px',
                          textTransform: 'none',
                          borderRadius: '16px',
                          py: '10px',
                          '&:hover': { backgroundColor: '#0071EB' },
                        }}
                      >
                        Acessar Link de Pagamento
                      </Button>
                    )}
                  </>
                );
              default:
                return <GenericErrorResult />;
            }
          })()}
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity as AlertColor}
          sx={{ width: '100%' }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {snackbar.title}
          </Typography>
          <Typography variant="body2">{snackbar.description}</Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}
