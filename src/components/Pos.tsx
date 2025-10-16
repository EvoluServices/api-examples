import React, {useEffect, useState} from 'react';
import {
    Box, FormControl, InputLabel, Select, MenuItem, TextField, Button,
    Snackbar, Alert, AlertColor, Typography,
    Grid
} from '@mui/material';
import { brands } from '@/components/Brand';
import { useTransaction } from '@/contexts/TransactionContext';
import {onlyDigits, isCpfCnpjLenValid, maskCpfCnpj} from '@/utils/document';
import { parseApiError } from '@/utils/httpErrors';
import { regexEmail } from '@/utils/regex';
import axios from 'axios';
import PosStatusPoller from '@/components/pos/PosStatusPoller';
import type { TxResult } from '@/types/transactions';

type PosProps = {
    autoSubmitNonce?: number;
    onConclude?: () => void;
    onResultChange?: React.Dispatch<React.SetStateAction<TxResult>>;
    onStatusChange?: (s: 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'PROCESSING' | 'ERROR') => void;
    onPaymentChange?: (v: number) => void;
};


export default function Pos({autoSubmitNonce, onResultChange, onStatusChange, onPaymentChange,}: PosProps) {
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
        customerEmail,
        setCustomerEmail,
        clearCustomerData,
    } = useTransaction();

    const amountFloat = parseFloat(amount || '0');

    const showBrand = paymentType === 'credit' || paymentType === 'debit';
    const showInstallments = paymentType === 'credit' && !!cardBrand;
    const showCustomerFields =
        (paymentType === 'debit' && !!cardBrand) ||
        (paymentType === 'credit' && !!installments);
    const showSubmitButton = showCustomerFields;

    const filteredBrands = brands.filter((b) => b.type === paymentType);

    const [touchedName, setTouchedName] = useState(false);
    const [touchedDocument, setTouchedDocument] = useState(false);
    const [touchedEmail, setTouchedEmail] = useState(false);

    const [posTxId, setPosTxId] = useState<string | null>(null);

    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    });

    const handleSubmit = async () => {
        const docDigits = onlyDigits(customerDocument);
        const validName = customerName && /^[A-Za-zÀ-ÿ\s]+$/.test(customerName);
        const validDoc = isCpfCnpjLenValid(docDigits);
        const validEmail = regexEmail.test(customerEmail);

        if (!validName || !validDoc || !validEmail) {
            setTouchedName(true);
            setTouchedDocument(true);
            setTouchedEmail(true);
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'Campos ausentes ou inválidos',
                description: 'Preencha todos os campos corretamente antes de finalizar.',
            });
            return;
        }

        const token = await fetchBearerToken();
        if (!token) {
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'Erro ao obter o token.',
                description: 'Verifique suas credenciais.',
            });
            return;
        }

        const response = await postRemoteTransaction(token);
        if (response?.success === 'true') {
            const txId = response.transactionId as string;

            setPosTxId(txId);
            onResultChange?.({
                uuid: txId,
                customerName,
                customerDocument,
                amount: amountFloat.toFixed(2),
                installments
            });
            onStatusChange?.('PROCESSING');
            onPaymentChange?.(0);

        } else {
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'Erro ao criar a transação.',
                description: 'Tente novamente.',
            });
        }
    };

    const fetchBearerToken = async () => {
      try {
        // O proxy do POS injeta Basic Auth via sessão JWE; body pode ser vazio
        const res = await axios.post('/api/proxy/pos/remote/token', {});
        return res.data?.Bearer || null;
      } catch (err) {
        const { title, description } = parseApiError(err);
        setSnackbar({ open: true, severity: 'error', title, description });
        return null;
      }
    };

    const postRemoteTransaction = async (token: string) => {
      try {
        // Busca merchantKey a partir da sessão HttpOnly (JWE)
        const meResp = await axios.get('/api/session/me');
        const merchantKey: string | undefined = meResp?.data?.merchantKey;
        if (!merchantKey) {
          throw new Error('Chave de Integração do Estabelecimento ausente na sessão.');
        }

        const payload = {
          transaction: {
            merchantId: merchantKey,
            value: amount,
            installments: parseInt(installments || '1'),
            clientName: customerName,
            clientDocument: customerDocument,
            clientEmail: customerEmail,
            paymentBrand: cardBrand,
            callbackUrl:
              'https://dqf9sjszu5.execute-api.us-east-2.amazonaws.com/prod/TransactionCallbackHandler',
          },
        };
        const headers = { bearer: token, 'Content-Type': 'application/json' };
        const res = await axios.post('/api/proxy/pos/remote/transaction', payload, { headers });
        return res.data;
      } catch (error) {
        const { title, description } = parseApiError(error);
        setSnackbar({ open: true, severity: 'error', title, description });
        return null;
      }
    };

    useEffect(() => {
        if (!autoSubmitNonce) return;

        const docOk = isCpfCnpjLenValid(onlyDigits(customerDocument));
        const emailOk = regexEmail.test(customerEmail);
        const nameOk = !!(customerName && /^[A-Za-zÀ-ÿ\s]+$/.test(customerName));
        const baseOk =
            (paymentType === 'debit' && !!cardBrand) ||
            (paymentType === 'credit' && !!cardBrand && !!installments);

        if (baseOk && nameOk && docOk && emailOk) {
            handleSubmit().catch(() => {
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Erro ao enviar transação',
                    description: 'Não foi possível iniciar a transação do POS.',
                });
            });
        }
    }, [autoSubmitNonce]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>

            <Grid container spacing={2}>

                <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel id="payment-type-label">Modalidade</InputLabel>
                        <Select
                            labelId="payment-type-label"
                            value={paymentType || ''}
                            label="Modalidade"
                            sx={{ borderRadius: 4, backgroundColor: '#fff' }}
                            onChange={(e) => {
                                setPaymentType(e.target.value as 'debit' | 'credit');
                                setCardBrand('');
                                setInstallments('');
                                clearCustomerData();
                                setCustomerName('');
                                setCustomerDocument('');
                                setCustomerEmail('');
                                setTouchedName(false);
                                setTouchedDocument(false);
                                setTouchedEmail(false);
                            }}
                        >
                            <MenuItem value="credit">Crédito</MenuItem>
                            <MenuItem value="debit">Débito</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>


                {showBrand && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel id="card-brand-label">Bandeira</InputLabel>
                            <Select
                                labelId="card-brand-label"
                                value={cardBrand || ''}
                                label="Bandeira"
                                sx={{ borderRadius: 4, backgroundColor: '#fff' }}
                                onChange={(e) => {
                                    setCardBrand(e.target.value as string);
                                    setInstallments('');
                                    clearCustomerData();
                                    setCustomerName('');
                                    setCustomerDocument('');
                                    setCustomerEmail('');
                                    setTouchedName(false);
                                    setTouchedDocument(false);
                                    setTouchedEmail(false);
                                }}
                            >
                                {filteredBrands.map((b) => (
                                    <MenuItem key={b.value} value={b.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <img src={b.images} alt={b.label} style={{ width: 24, height: 16, marginRight: 8 }} />
                                            {b.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}


                {showInstallments && (
                    <Grid size={{ xs: 12, md: 5 }}>
                        <FormControl fullWidth>
                            <InputLabel id="installments-label">Parcelamento</InputLabel>
                            <Select
                                labelId="installments-label"
                                value={installments}
                                label="Parcelamento"
                                sx={{ borderRadius: 4, backgroundColor: '#fff' }}
                                onChange={(e) => {
                                    setInstallments(e.target.value as string);
                                    clearCustomerData();
                                    setCustomerName('');
                                    setCustomerDocument('');
                                    setCustomerEmail('');
                                    setTouchedName(false);
                                    setTouchedDocument(false);
                                    setTouchedEmail(false);
                                }}
                            >
                                {[...Array(24)].map((_, i) => {
                                    const qty = i + 1;
                                    const per = amountFloat > 0 ? amountFloat / qty : 0;
                                    return (
                                        <MenuItem key={qty} value={String(qty)}>
                                            {qty}x de {per.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
            </Grid>


            {showCustomerFields && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                        label="Nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={() => setTouchedName(true)}
                        error={touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, backgroundColor: '#FFF' } }}
                    />
                    <TextField
                        label="Documento"
                        value={maskCpfCnpj(customerDocument)}
                        onChange={(e) => {
                            const raw = onlyDigits(e.target.value);
                            const clamped = raw.slice(0, 14);
                            setCustomerDocument(clamped);
                        }}
                        onBlur={() => setTouchedDocument(true)}
                        error={touchedDocument && !isCpfCnpjLenValid(onlyDigits(customerDocument))}

                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, backgroundColor: '#FFF' } }}
                    />
                    <TextField
                        label="Email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        onBlur={() => setTouchedEmail(true)}
                        error={touchedEmail && !regexEmail.test(customerEmail)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, backgroundColor: '#FFF' } }}
                    />
                </Box>
            )}


            {showSubmitButton && (
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button
                        variant="contained"
                        sx={{
                            borderRadius: '16px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            backgroundColor: '#FFF',
                            color: '#0071EB',
                            minWidth: 120,
                            minHeight: 60,
                            boxShadow: 'none',
                            border: '1px solid #ccc',
                        }}
                        onClick={() => {
                            setCustomerName('');
                            setCustomerDocument('');
                            setCustomerEmail('');
                            setTouchedName(false);
                            setTouchedDocument(false);
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
                            py: '10px',
                            '&:hover': { backgroundColor: '#0071EB' },
                        }}
                        onClick={handleSubmit}
                    >
                        Finalizar
                    </Button>
                </Box>
            )}


            {posTxId && (
                <PosStatusPoller
                    transactionId={posTxId}
                    onStatusChange={(s) => onStatusChange?.(s)}
                    onPaymentChange={(v) => onPaymentChange?.(v)}
                    onApprovedData={(d) => {
                        onResultChange?.((prev) =>
                            prev
                                ? {
                                    ...prev,
                                    customerName: d.customerName,
                                    customerDocument: d.customerDocument,
                                    amount: d.amount.toFixed(2),
                                    installments: d.installments,
                                }
                                : {
                                    uuid: posTxId,
                                    customerName: d.customerName,
                                    customerDocument: d.customerDocument,
                                    amount: d.amount.toFixed(2),
                                    installments: d.installments,
                                }
                        );
                    }}
                />
            )}


            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                    severity={snackbar.severity as AlertColor}
                    sx={{ width: '100%' }}
                >
                    <Typography variant="subtitle1" fontWeight="bold">
                        {snackbar.title}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
                        {snackbar.description}
                    </Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}
