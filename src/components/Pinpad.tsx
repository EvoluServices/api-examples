import React, {useEffect, useState} from 'react';
import Grid from '@mui/material/Grid';
import {
    Alert,
    AlertColor,
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import {brands} from '@/components/Brand';
import {useTransaction} from '@/contexts/TransactionContext';
import { useMerchant } from '@/contexts/MerchantContext';
import {isCpfCnpjLenValid, maskCpfCnpj, onlyDigits} from '@/utils/document';
import {parseApiError} from '@/utils/httpErrors';
import {regexEmail} from '@/utils/regex';
import axios from 'axios';
import Beneficiaries from '@/components/split/Beneficiaries';
import PinpadStatusPoller from '@/components/pinpad/PinpadStatusPoller';
import type {TxResult} from '@/types/transactions';

type PinpadProps = {
    autoSubmitNonce?: number;
    onConclude?: () => void;
    onResultChange?: React.Dispatch<React.SetStateAction<TxResult>>;
    onStatusChange?: (s: 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'PROCESSING' | 'ERROR') => void;
    onPaymentChange?: (v: number) => void;
};

export default function Pinpad({
                                   autoSubmitNonce,
                                   onResultChange,
                                   onStatusChange,
                                   onPaymentChange,
                               }: PinpadProps) {
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

    const { merchant } = useMerchant();
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
    const [pinpadTxId, setPinpadTxId] = useState<string | null>(null);
    const [splitsOk, setSplitsOk] = useState(true);

    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    });

    const [saleType, setSaleType] = useState<'convencional'
        | 'split' | null>(null);

    const [splits, setSplits] = useState<
        { code: string; value: string; chargeFees: boolean }[]
    >([]);

    // 💰 Taxa efetiva baseada na modalidade e bandeira
    const [feeRate, setFeeRate] = useState(0);

    // 💰 Taxa efetiva baseada na modalidade / parcelas
    useEffect(() => {
        if (!installments) {
            setFeeRate(0);
            return;
        }

        const n = Number(installments);
        let rate = 0;

        const table = merchant?.installmentRates;
        const typeKey = paymentType === 'debit' ? 'debit' : 'credit';

        if (table && table[typeKey] && typeof table[typeKey][n] === 'number') {
            rate = table[typeKey][n];
        } else {

            if (paymentType === 'debit') {
                rate = 0.0198; // 1,98%
            } else if (paymentType === 'credit') {
                if (n === 1) {
                    rate = 0.0299; // 2,99%
                } else if (n <= 6) {
                    rate = 0.0349; // 3,49%
                } else if (n <= 12) {
                    rate = 0.0389; // 3,89%
                }
            }
        }

        setFeeRate(rate);
    }, [paymentType, installments, merchant]);


    const handleSubmit = async () => {
        // ✅ Recalcula o valor líquido permitido no momento do clique
        const saleValue = parseFloat(amount || '0');
        const netAvailable = saleValue * (1 - (feeRate || 0));
        const totalSplit = splits.reduce(
            (acc, s) => acc + (parseFloat(s.value || '0') || 0),
            0
        );

        // 🚫 Bloqueia se ultrapassar o valor líquido
        if (saleType === 'split' && totalSplit > netAvailable + 1e-6) {
            setSnackbar({
                open: true,
                severity: 'warning',
                title: 'Valor de repasse inválido',
                description: `O total dos repasses (${totalSplit.toFixed(2)}) ultrapassa o valor líquido permitido (${netAvailable.toFixed(2)}) após a taxa de ${(feeRate * 100).toFixed(2)}%. 
Ajuste os valores antes de continuar.`,
            });
            return;
        }

        // 🚫 Bloqueia envio se flag global ainda estiver falsa
        if (saleType === 'split' && !splitsOk) {
            setSnackbar({
                open: true,
                severity: 'warning',
                title: 'Valor do repasse inválido',
                description: `O total dos repasses ultrapassa o valor líquido permitido após a taxa de ${(feeRate * 100).toFixed(2)}%. 
Ajuste os valores antes de continuar.`,
            });
            return;
        }




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

            setPinpadTxId(txId);
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
            // Proxy do Pinpad já injeta Basic Auth via sessão JWE; body pode ser vazio
            const res = await axios.post(`/api/proxy/pinpad/remote/token`, {});
            return res.data?.Bearer || null;
        } catch (err) {
            const { title, description } = parseApiError(err);
            setSnackbar({ open: true, severity: 'error', title, description });
            return null;
        }
    };

    const postRemoteTransaction = async (token: string) => {
        try {
            const meResp = await axios.get('/api/session/me');
            const merchantKey: string | undefined = meResp?.data?.merchantKey;
            if (!merchantKey) {
                throw new Error('Chave de Integração do Estabelecimento ausente na sessão.');
            }

            const cleanedValue = String(amount)
                .replace(/\s/g, '')
                .replace(',', '.')
                .replace(/[^\d.]/g, '');

            const parsedValue = parseFloat(cleanedValue);

            if (isNaN(parsedValue) || parsedValue <= 0) {
                console.warn('⚠️ Valor inválido detectado:', amount);
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Valor inválido',
                    description: 'Informe um valor válido antes de finalizar a venda.',
                });
                return null;
            }

            const brandRaw = (cardBrand ?? '').toString().trim();

            if (!brandRaw) {
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Bandeira não selecionada',
                    description: 'Selecione uma bandeira antes de finalizar.',
                });
                return null;
            }

            const payload = {
                transaction: {
                    merchantId: merchantKey,
                    value: parsedValue.toFixed(2),
                    installments: parseInt(installments || '1', 10),
                    clientName: (customerName || '').trim(),
                    clientDocument: (customerDocument || '').trim(),
                    clientEmail: (customerEmail || '').trim(),
                    paymentBrand: brandRaw,
                    callbackUrl:
                        'https://dqf9sjszu5.execute-api.us-east-2.amazonaws.com/prod/TransactionCallbackHandler',
                    ...(saleType === 'split' && {
                      splits: splits.map((s) => ({
                        code: s.code,
                        value: s.value,
                        chargeFees: s.chargeFees,
                      })),
                    }),
                },
            };

            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
            const res = await axios.post(`/api/proxy/pinpad/remote/transaction`, payload, { headers });
            return res.data;

        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error('❌ Erro na requisição Pinpad:');
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            } else {
                console.error('❌ Erro inesperado:', error);
            }

            try {
              if (axios.isAxiosError(error)) {
                console.error('🧯 [Pinpad POST] Axios error config:', JSON.stringify({
                  url: error.config?.url,
                  method: error.config?.method,
                  headers: error.config?.headers,
                  data: error.config?.data,
                }, null, 2));
              }
            } catch {}

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
                    description: 'Não foi possível iniciar a transação do Pinpad.',
                });
            });
        }
    }, [autoSubmitNonce]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>

            {/* 🧭 Botões de tipo de venda (Convencional / split) */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant={saleType === 'convencional' ? 'contained' : 'outlined'}
                    onClick={() => {
                        setSaleType('convencional');
                        setSplits([]);
                        setPaymentType('' as any);
                        setCardBrand('');
                        setInstallments('');
                        clearCustomerData();
                        setCustomerName('');
                        setCustomerDocument('');
                        setCustomerEmail('');
                    }}
                    sx={{
                        flex: 1,
                        minHeight: 60,
                        borderRadius: 4,
                        backgroundColor: saleType === 'convencional' ? '#0071EB' : '#fff',
                        color: saleType === 'convencional' ? '#fff' : '#0071EB',
                        border: '1px solid #0071EB',
                        fontWeight: 700,
                        fontSize: '14px',
                        '&:hover': {
                            backgroundColor: saleType === 'convencional' ? '#005bb5' : '#f0f7ff',
                        },
                    }}
                >
                    Venda Convencional
                </Button>

                <Button
                    variant={saleType === 'split' ? 'contained' : 'outlined'}
                    onClick={() => {
                        setSaleType('split');
                        setSplits([{ code: '', value: '', chargeFees: false }]);
                        setPaymentType('' as any);
                        setCardBrand('');
                        setInstallments('');
                        clearCustomerData();
                        setCustomerName('');
                        setCustomerDocument('');
                        setCustomerEmail('');
                    }}
                    sx={{
                        flex: 1,
                        minHeight: 60,
                        borderRadius: 4,
                        backgroundColor: saleType === 'split' ? '#0071EB' : '#fff',
                        color: saleType === 'split' ? '#fff' : '#0071EB',
                        border: '1px solid #0071EB',
                        fontWeight: 700,
                        fontSize: '14px',
                        '&:hover': {
                            backgroundColor: saleType === 'split' ? '#005bb5' : '#f0f7ff',
                        },
                    }}
                >
                    Split
                </Button>
            </Box>

            {/* Containers de fornecedores */}
            {saleType === 'split' && (
                <>
                    <Beneficiaries
                        visible={saleType === 'split'}
                        value={splits}
                        onChange={setSplits}
                        saleAmount={amountFloat}
                        onValidityChange={setSplitsOk}
                        feeRate={feeRate}
                    />
                </>
            )}

            {/* Container geral */}
            <Grid container spacing={2} direction="column">
                {/* Linha dos botões Crédito/Débito */}
                <Grid>
                    <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={2}
                    >
                        {/* Botão Crédito */}
                        <Button
                            variant={paymentType === 'credit' ? 'contained' : 'outlined'}
                            startIcon={<CreditCardIcon />}
                            onClick={() => {
                                setPaymentType('credit');
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
                            sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                minWidth: 128,
                                borderColor: '#0071EB',
                                color: paymentType === 'credit' ? '#fff' : '#0071EB',
                                backgroundColor: paymentType === 'credit' ? '#0071EB' : 'transparent',
                                '&:hover': {
                                    backgroundColor:
                                        paymentType === 'credit'
                                            ? '#005FCC'
                                            : 'rgba(0, 113, 235, 0.08)',
                                    borderColor: '#005FCC',
                                },
                            }}
                        >
                            Crédito
                        </Button>

                        {/* Botão Débito */}
                        <Button
                            variant={paymentType === 'debit' ? 'contained' : 'outlined'}
                            startIcon={<PaymentIcon />}
                            onClick={() => {
                                setPaymentType('debit');
                                setCardBrand('');
                                setInstallments('1');
                                clearCustomerData();
                                setCustomerName('');
                                setCustomerDocument('');
                                setCustomerEmail('');
                                setTouchedName(false);
                                setTouchedDocument(false);
                                setTouchedEmail(false);
                            }}
                            sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                minWidth: 128,
                                borderColor: '#0071EB',
                                color: paymentType === 'debit' ? '#fff' : '#0071EB',
                                backgroundColor: paymentType === 'debit' ? '#0071EB' : 'transparent',
                                '&:hover': {
                                    backgroundColor:
                                        paymentType === 'debit'
                                            ? '#005FCC'
                                            : 'rgba(0, 113, 235, 0.08)',
                                    borderColor: '#005FCC',
                                },
                            }}
                        >
                            Débito
                        </Button>
                    </Box>
                </Grid>

                {/* Bandeira e fluxo seguinte — só aparece após selecionar crédito/débito */}
                {showBrand && (
                    <Grid>
                        <FormControl fullWidth>
                            <InputLabel id="card-brand-label">Bandeira</InputLabel>
                            <Select
                                labelId="card-brand-label"
                                value={cardBrand || ''}
                                label="Bandeira"
                                sx={{ borderRadius: 4, backgroundColor: '#fff', mt: 1 }}
                                onChange={(e) => {
                                    const newBrand = e.target.value as string;
                                    setCardBrand(newBrand);
                                    setInstallments('');
                                    clearCustomerData();
                                    setCustomerName('');
                                    setCustomerDocument('');
                                    setCustomerEmail('');
                                    setTouchedName(false);
                                    setTouchedDocument(false);
                                    setTouchedEmail(false);

                                    // 🔁 Força o Beneficiaries recalcular o valor permitido com a nova taxa
                                    setTimeout(() => setSplits((prev) => [...prev]), 0);
                                }}
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
                    </Grid>
                )}
            </Grid>

            {/* Parcelamento — aparece após escolher bandeira no crédito */}
            {showInstallments && (
                <Grid>
                    <FormControl fullWidth>
                        <InputLabel id="installments-label">Parcelas</InputLabel>
                        <Select
                            labelId="installments-label"
                            value={installments || ''}
                            label="Parcelas"
                            sx={{ borderRadius: 4, backgroundColor: '#fff', mt: 1 }}
                            onChange={(e) => {
                                const newInstallments = e.target.value as string;
                                setInstallments(newInstallments);
                            }}
                        >
                            {[...Array(12)].map((_, i) => {
                                const num = i + 1;
                                const parcela = amountFloat / num;
                                return (
                                    <MenuItem key={num} value={num.toString()}>
                                        {num}x de R$ {parcela.toFixed(2).replace('.', ',')}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                </Grid>
            )}



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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
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
                            disabled={saleType === 'split' && !splitsOk}
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
                </Box>
            )}

            {pinpadTxId && (
                <PinpadStatusPoller
                    transactionId={pinpadTxId}
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
                                    uuid: pinpadTxId,
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
