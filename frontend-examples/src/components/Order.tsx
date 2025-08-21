import {useEffect, useState} from 'react';
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
  Alert, AlertColor
} from '@mui/material';

import Cookies from 'js-cookie';
import axios from 'axios';

import { useTransaction } from '@/contexts/TransactionContext';
import { brands } from './Brand';
import SuccessResult from "@/components/SuccessResult";
import RejectedResult from "@/components/RejectedResult";
import GenericErrorResult from "@/components/GenericErrorResult";

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

  const [orderResult, setOrderResult] = useState<{
    payUrl: string;
    uuid: string;
    customerName?: string;
    amount?: string;
    installments?: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: 'error', // 'success' | 'info' | 'warning'
    title: '',
    description: '',
  })

  const fetchOrderStatus = async (uuid: string) => {
    const configCookie = Cookies.get('api-examples-config');
    if (!configCookie) {
      throw new Error('Configuração de autenticação não encontrada.');
    }

    const parsedConfig = JSON.parse(configCookie);
    const { url, values } = parsedConfig;
    const credentials = btoa(`${values.apiKey}:${values.apiSecret}`);

    const response = await axios.get(`${url}/api/orders/${uuid}`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("Resposta da API de status da transação:", response.data);

    return response.data;
  };

  const [orderStatus, setOrderStatus] = useState<string>('PENDING'); // status inicial
  const [elapsedTime, setElapsedTime] = useState<number>(0);

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
          setElapsedTime(prev => {
            const newTime = prev + 30;
            if (newTime >= 300) clearInterval(interval);
            return newTime;
          });
        }
      } catch (err) {
        console.error('Erro ao verificar status da transação:', err);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [orderResult?.uuid, elapsedTime, orderStatus]);


  const handleSubmit = async () => {
    try {
      const configCookie = Cookies.get('api-examples-config');
      if (!configCookie) {
        setSnackbar({
          open: true,
          severity: 'error',
          title: 'Configuração não encontrada.',
          description: 'Verifique se você informou suas credenciais de autenticação.',
        });
        setSnackbarOpen(true);
        return;
      }

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
              customerDocument,
              description: 'Venda de equipamento',
              recurrent: false,
            },
          },
          {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
          }
      );

      const { payUrl, uuid,  } = response.data;
      setOrderResult({
        payUrl,
        uuid,
        customerName,
        amount: amountFloat.toFixed(2),
        installments,
      });
      setModalOpen(true);

    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      alert("Erro ao criar pedido. Verifique os dados ou tente novamente.");
    }
  };

  return (
      <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 4,
            mt: 2,
          }}
      >
        {/* Coluna da esquerda: campos do pedido */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

          <Box sx={{display: 'flex', flexDirection: 'row', gap: 2 }}>
            {/* Card Brand */}
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

              {/* Parcelamento */}
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

          {/* Campos do Cliente */}
          {showCustomerFields && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 500 }}>
                <TextField label="Nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} sx={{ backgroundColor: '#FFF' }} />
                <TextField label="Documento" value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} sx={{ backgroundColor: '#FFF' }} />
                <TextField label="Telefone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} sx={{ backgroundColor: '#FFF' }} />
                <TextField label="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} sx={{ backgroundColor: '#FFF' }} />
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
                      '&:hover': {
                        backgroundColor: '#0071EB',
                      },
                    }}
                    onClick={handleSubmit}
                >
                  Finalizar
                </Button>
              </Box>
          )}
        </Box>

        {/* Coluna da direita: resultado */}
        {orderResult && (
            <Box sx={{ ml: 20, height: 'fit-content', alignSelf: 'flex-start' }}>
              {(() => {
                switch (orderStatus) {
                  case 'APPROVED':
                    return (
                        <SuccessResult
                            customerName={customerName}
                            amount={amountFloat}
                            installments={installments}
                        />
                    );

                  case 'DISAPPROVED':
                    return (
                        <RejectedResult/>
                    );

                  case 'PENDING':
                  case 'ABORTED': // ABORTED segue o mesmo fluxo visual de pagamento pendente
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
                    return (
                        <GenericErrorResult/>
                    );
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
