import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Snackbar,
    Alert,
    AlertColor,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
} from '@mui/material';
import {brands} from '@/components/Brand';
import {useTransaction} from '@/contexts/TransactionContext';
import {onlyDigits, isCpfCnpjLenValid, maskCpfCnpj} from '@/utils/document';
import {parseApiError} from '@/utils/httpErrors';
import {regexEmail} from '@/utils/regex';
import axios from 'axios';
import PosStatusPoller from '@/components/pos/PosStatusPoller';
import Beneficiaries from '@/components/split/Beneficiaries';
import type {TxResult} from '@/types/transactions';
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentIcon from "@mui/icons-material/Payment";


type PosProps = {
    autoSubmitNonce?: number;
    onConclude?: () => void;
    onResultChange?: React.Dispatch<React.SetStateAction<TxResult>>;
    onStatusChange?: (
        s: 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'PROCESSING' | 'ERROR'
    ) => void;
    onPaymentChange?: (v: number) => void;
};

export default function Pos({
                                autoSubmitNonce,
                                onResultChange,
                                onStatusChange,
                                onPaymentChange,
                            }: PosProps) {
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

    const [pinpadTxId, setPinpadTxId] = useState<string | null>(null);

    const [splitsOk, setSplitsOk] = useState(true);


    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    });

    const [saleType, setSaleType] = useState<'convencional' | 'split' | null>(null);

    const [splits, setSplits] = useState<
        { code: string; value: string; chargeFees: boolean }[]
    >([]);

    // ⬇️ o próximo bloco é a função handleSubmit
    const handleSubmit = async () => {
        // Impede finalizar quando soma dos splits excede o valor da venda
        if (saleType === 'split' && !splitsOk) {
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'Valor de split inválido',
                description: 'A soma dos splits não pode exceder o valor da venda.',
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
            const {title, description} = parseApiError(err);
            setSnackbar({open: true, severity: 'error', title, description});
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

            const cleanedBrand = brandRaw;

            const payload = {
                transaction: {
                    merchantId: merchantKey,
                    value: parsedValue.toFixed(2),
                    installments: parseInt(installments || '1', 10),
                    clientName: (customerName || '').trim(),
                    clientDocument: (customerDocument || '').trim(),
                    clientEmail: (customerEmail || '').trim(),
                    paymentBrand: cleanedBrand,
                    callbackUrl:
                        'https://dqf9sjszu5.execute-api.us-east-2.amazonaws.com/prod/TransactionCallbackHandler',
                    ...(saleType === 'split' && { splits }),
                },
            };

            const headers = {bearer: token, 'Content-Type': 'application/json'};
            const res = await axios.post(`/api/proxy/pinpad/remote/transaction`, payload, {headers});
            return res.data;

        } catch (error: any) {
            const {title, description} = parseApiError(error);
            setSnackbar({open: true, severity: 'error', title, description});
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
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 2}}>

            {/* 🧭 Botões de tipo de venda (Convencional / split) */}
            <Box sx={{display: 'flex', gap: 2}}>
                <Button
                    variant={saleType === 'convencional' ? 'contained' : 'outlined'}
                    onClick={() => {
                        setSaleType('convencional');
                        setSplits([]); // limpa fornecedores se trocar de tipo
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

            {saleType === 'split' && (
                <Beneficiaries
                    visible={saleType === 'split'}
                    value={splits}
                    onChange={setSplits}
                    saleAmount={amountFloat}
                    onValidityChange={setSplitsOk}
                />
            )}

            <Grid container spacing={2} direction="column">
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
                            startIcon={<CreditCardIcon/>}
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
                                minWidth: 120,
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
                            startIcon={<PaymentIcon/>}
                            onClick={() => {
                                setPaymentType('debit');
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
                                minWidth: 120,
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
                                sx={{borderRadius: 4, backgroundColor: '#fff', mt: 1}}
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
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                            <img
                                                src={b.images}
                                                alt={b.label}
                                                style={{width: 24, height: 16, marginRight: 8}}
                                            />
                                            {b.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}

                {/* Parcelamento (abaixo da bandeira) */}
                {showInstallments && (
                    <Grid>
                        <FormControl fullWidth>
                            <InputLabel id="installments-label">Parcelamento</InputLabel>
                            <Select
                                labelId="installments-label"
                                value={installments}
                                label="Parcelamento"
                                sx={{borderRadius: 4, backgroundColor: '#fff', mt: 1}}
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
                                            {qty}x de{' '}
                                            {per.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
            </Grid>


            {showCustomerFields && (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                    <TextField
                        label="Nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={() => setTouchedName(true)}
                        error={touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))}
                        sx={{'& .MuiOutlinedInput-root': {borderRadius: 4, backgroundColor: '#FFF'}}}
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

                        sx={{'& .MuiOutlinedInput-root': {borderRadius: 4, backgroundColor: '#FFF'}}}
                    />
                    <TextField
                        label="Email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        onBlur={() => setTouchedEmail(true)}
                        error={touchedEmail && !regexEmail.test(customerEmail)}
                        sx={{'& .MuiOutlinedInput-root': {borderRadius: 4, backgroundColor: '#FFF'}}}
                    />
                </Box>
            )}


            {showSubmitButton && (
                <Box sx={{display: 'flex', gap: 2, mt: 1}}>
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
                            '&:hover': {backgroundColor: '#0071EB'},
                        }}
                        onClick={handleSubmit}
                    >
                        Finalizar
                    </Button>
                </Box>
            )}


            {pinpadTxId && (
                <PosStatusPoller
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
                onClose={() => setSnackbar((p) => ({...p, open: false}))}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert
                    onClose={() => setSnackbar((p) => ({...p, open: false}))}
                    severity={snackbar.severity as AlertColor}
                    sx={{width: '100%'}}
                >
                    <Typography variant="subtitle1" fontWeight="bold">
                        {snackbar.title}
                    </Typography>
                    <Typography sx={{whiteSpace: 'pre-line'}} variant="body2">
                        {snackbar.description}
                    </Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}