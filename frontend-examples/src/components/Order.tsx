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
  Alert,
  AlertColor,
} from '@mui/material';

type OrderProps = {
  onConclude?: () => void;
};


import axios from 'axios';
import { useTransaction } from '@/contexts/TransactionContext';
import { brands } from './Brand';
import SuccessResult from "@/components/SuccessResult";
import RejectedResult from "@/components/RejectedResult";
import GenericErrorResult from "@/components/GenericErrorResult";
import { getApiConfigFromCookies, buildBasicAuthHeader } from '@/utils/cookies';
import { maskCpfCnpj, onlyDigits, isCpfCnpjLenValid } from '@/utils/document';
import { isNameValid } from '@/utils/nameValidation';
import { parseApiError } from '@/utils/httpErrors';

export default function Order({ onConclude }: OrderProps) {
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
    resetTransaction,
  } = useTransaction();

  const amountFloat = parseFloat(amount || '0');
  const showBrand = !!amount;
  const showInstallments = showBrand && !!cardBrand;
  const showCustomerFields = showInstallments && !!installments;
  const creditBrands = brands.filter((b) => b.type === 'credit');
  const [payment, setPayment] = useState<number>(0);
  const [docTouched, setDocTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const [orderResult, setOrderResult] = useState<{
    payUrl: string;
    uuid: string;
    customerName?: string;
    customerDocument?: string;
    amount?: string;
    installments?: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleConclude = () => {
    setOrderResult(null);
    setOrderStatus('PENDING');
    setPayment(0);
    setElapsedTime(0);
    setDocTouched(false);
    setNameTouched(false);

    resetTransaction();
    onConclude?.();
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: 'error' as AlertColor,
    title: '',
    description: '',
  })

  const fetchOrderStatus = async (uuid: string) => {
    const cfg = getApiConfigFromCookies();
    const headers = buildBasicAuthHeader(cfg);

    const response = await axios.get(`${cfg.url}/api/orders/${uuid}`, { headers });

    console.log('Resposta da API de status da transação:', response.data);
    return response.data;
  };

  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  function sumPayments(orderData: any): number {
    if (!orderData?.transactionList) return 0;

    const cents = orderData.transactionList.reduce((totalCents: number, transaction: any) => {
      const pCents = (transaction.payments || []).reduce((acc: number, p: any) => {
        const v = typeof p.amount === 'string' ? p.amount.replace(',', '.') : String(p.amount);
        return acc + Math.round(parseFloat(v) * 100);
      }, 0);
      return totalCents + pCents;
    }, 0);

    return cents / 100;
  }

  useEffect(() => {
    if (!orderResult?.uuid || orderStatus === 'APPROVED') return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchOrderStatus(orderResult.uuid);
        const status = data.status;
        const totalPayments = sumPayments(data);
        console.log("Total de pagamentos:", totalPayments);

        setPayment(totalPayments);


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
      const cfg = getApiConfigFromCookies();
      const headers = buildBasicAuthHeader(cfg);

      if (!amountFloat || amountFloat <= 0) {
        setSnackbar({ open: true, severity: 'error', title: 'Valor inválido', description: 'Informe um valor maior que zero.' });
        return;
      }
      if (!installments) {
        setSnackbar({ open: true, severity: 'error', title: 'Parcelamento', description: 'Selecione o parcelamento.' });
        return;
      }
      if (!cfg.values?.merchantKey) {
        setSnackbar({ open: true, severity: 'error', title: 'Credenciais', description: 'Chave de Integração do Estabelecimento ausente.' });
        return;
      }

      const payload = {
        order: {
          reference: '123CLIENTS',
          amount: String(Math.round(amountFloat * 100)),
          maxInstallments: installments,
          minInstallments: installments,
          merchantCode: cfg.values.merchantKey,
          customerName,
          customerDocument,
          description: 'Venda de equipamento',
          recurrent: false,
        },
      };

      // no handleSubmit
      const res = await axios.post(
          `${cfg.url}/api/orders`,
          payload,
          { headers, validateStatus: () => true }   // <= não lança em 4xx/5xx
      );

      if (res.status >= 400) {
        const ui = parseApiError({ response: res } as any);
        setSnackbar({ open: true, severity: 'error', title: ui.title, description: ui.description });
        return; // interrompe o fluxo
      }

      const { payUrl, uuid } = res.data;
      setOrderResult({ payUrl, uuid, customerName, customerDocument, amount: amountFloat.toFixed(2), installments });
      setModalOpen(true);


      setModalOpen(true);
    } catch (error) {
      // console.error('Erro ao criar pedido:', error); // remova
      console.warn('Erro ao criar pedido:', error);     // opcional
      const ui = parseApiError(error);
      setSnackbar({ open: true, severity: 'error', title: ui.title, description: ui.description });
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

                <TextField
                    label="Nome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onBlur={() => setNameTouched(true)}
                    error={nameTouched && !isNameValid(customerName)}
                    sx={{ backgroundColor: '#FFF' }}
                />

                <TextField
                    label="Documento"
                    value={maskCpfCnpj(customerDocument)}
                    onChange={(e) => {
                      const digits = onlyDigits(e.target.value).slice(0, 14);
                      setCustomerDocument(digits);
                    }}
                    onBlur={() => setDocTouched(true)}
                    error={docTouched && !isCpfCnpjLenValid(customerDocument)}
                    sx={{ backgroundColor: '#FFF'}}
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
                            customerDocument={customerDocument}
                            amount={amountFloat}
                            installments={installments}
                            payment={payment}
                            onConclude={handleConclude}
                        />
                    );

                  case 'DISAPPROVED':
                    return (
                        <RejectedResult/>
                    );

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
            <Typography
                sx={{ whiteSpace: 'pre-line' }}
                variant="body2">{snackbar.description}</Typography>
          </Alert>
        </Snackbar>
      </Box>
  );
}
