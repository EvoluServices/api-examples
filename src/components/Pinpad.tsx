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
import PinpadStatusPoller from '@/components/pinpad/PinpadStatusPoller';
import type { TxResult } from '@/types/transactions';

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

    // Tipo de repasse dentro do split: manual ou automático
    const [repasseType, setRepasseType] = useState<'manual' | 'automatico' | null>(null);



    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    });

    // ------------------------------------------------------
    // 🧩 Parte 1 - Estados de controle do fluxo de venda
    // ------------------------------------------------------

    // Tipo de venda: 'convencional', 'split' ou nenhum selecionado ainda
    const [saleType, setSaleType] = useState<'convencional' | 'split' | null>(null);

    // Lista de fornecedores e regras de split
    const [splits, setSplits] = useState<
        { code: string; value: string; chargeFees: boolean }[]
    >([]);

    // Lista simulada de fornecedores (pode vir de API futuramente)
    const fornecedores = [
        { code: '9YTDOO', name: 'Fornecedor 1' },
        { code: '0I52ZJ', name: 'Fornecedor 2' },
        { code: 'AB12CD', name: 'Fornecedor 3' },
    ];

    // ⬇️ o próximo bloco é a função handleSubmit
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

            // ✅ Corrige e valida o valor enviado
            const cleanedValue = String(amount)
                .replace(/\s/g, '')       // remove espaços
                .replace(',', '.')        // substitui vírgula por ponto
                .replace(/[^\d.]/g, '');  // remove qualquer caractere que não seja número ou ponto

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

            // ✅ Usa o valor do Brand.tsx e normaliza conforme Cielo, Rede e Vero
            const brandRaw = (cardBrand ?? '').toString().trim().toUpperCase();

            if (!brandRaw) {
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Bandeira não selecionada',
                    description: 'Selecione uma bandeira antes de finalizar.',
                });
                return null;
            }

            // 🧩 Normalização para adquirentes (Cielo, Rede, Vero)
            // Remove sufixos e ajusta nomes específicos
            // ✅ Normaliza as bandeiras para formato aceito pelas adquirentes (Cielo / Rede / Vero)
            let cleanedBrand = brandRaw.trim().toUpperCase();

// Remove sufixos internos do Brand.tsx
            cleanedBrand = cleanedBrand.replace('_CREDITO', '').replace('_DEBITO', '');

// Ajuste por tipo de pagamento (Crédito ou Débito)
            if (paymentType === 'credit') {
                // Cielo/Rede/Vero geralmente prefixam "CRED_"
                cleanedBrand = `CRED_${cleanedBrand}`;
            } else if (paymentType === 'debit') {
                // Para Débito, prefixam "DEB_"
                cleanedBrand = `DEB_${cleanedBrand}`;
            }

// Correções específicas para nomes conhecidos
            if (cleanedBrand.includes('AMEX')) cleanedBrand = cleanedBrand.replace('AMEX', 'AMERICANEXPRESS');


            // ✅ Montagem do payload final
            const payload = {
                transaction: {
                    merchantId: merchantKey,
                    value: parsedValue.toFixed(2), // formato "100.00"
                    installments: parseInt(installments || '1', 10),
                    clientName: (customerName || '').trim(),
                    clientDocument: (customerDocument || '').trim(),
                    clientEmail: (customerEmail || '').trim(),
                    paymentBrand: cleanedBrand,
                    callbackUrl:
                        'https://dqf9sjszu5.execute-api.us-east-2.amazonaws.com/prod/TransactionCallbackHandler',
                    ...(saleType === 'split' && { splits }), // inclui splits apenas no modo split
                },
            };

            const headers = { bearer: token, 'Content-Type': 'application/json' };

            // 🧭 LOGS DE DEPURAÇÃO
            console.log('💰 Valor original digitado:', amount);
            console.log('💰 Valor limpo:', cleanedValue);
            console.log('📤 Tipo final do value:', typeof parsedValue, parsedValue);
            console.log('🧾 paymentBrand enviado:', payload.transaction.paymentBrand);
            console.log('➡️ Enviando payload completo:', JSON.stringify(payload, null, 2));

            const res = await axios.post(`/api/proxy/pinpad/remote/transaction`, payload, { headers });
            return res.data;

        } catch (error: any) {
            // 🔍 LOG detalhado do erro
            if (axios.isAxiosError(error)) {
                console.error('❌ Erro na requisição Pinpad:');
                console.error('Status:', error.response?.status);
                console.error('Data:', error.response?.data);
            } else {
                console.error('❌ Erro inesperado:', error);
            }

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

            {/* 🧭 Botões de tipo de venda (Convencional / Split) */}
            <Box sx={{ display: 'flex', gap: 2 }}>
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

            {/* Tipo de repasse — aparece apenas no modo Split */}
            {saleType === 'split' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Botão Manual */}
                    <Button
                        onClick={() => setRepasseType('manual')}
                        sx={{
                            flex: 1,
                            minHeight: 60,
                            borderRadius: 4,
                            border: '2px solid #0071EB',
                            backgroundColor: '#fff',
                            color: '#0071EB',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            '&:hover': { backgroundColor: '#f7faff' },
                        }}
                    >
                        <Box
                            sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: '2px solid #0071EB',
                                backgroundColor: repasseType === 'manual' ? '#0071EB' : 'transparent',
                            }}
                        />
                        MANUAL
                    </Button>

                    {/* Botão Automático */}
                    <Button
                        onClick={() => setRepasseType('automatico')}
                        sx={{
                            flex: 1,
                            minHeight: 60,
                            borderRadius: 4,
                            border: '2px solid #0071EB',
                            backgroundColor: '#fff',
                            color: '#0071EB',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            '&:hover': { backgroundColor: '#f7faff' },
                        }}
                    >
                        <Box
                            sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: '2px solid #0071EB',
                                backgroundColor:
                                    repasseType === 'automatico' ? '#0071EB' : 'transparent',
                            }}
                        />
                        AUTOMÁTICO
                    </Button>
                </Box>
            )}


            {saleType === 'split' && repasseType && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {splits.map((split, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 2,
                                border: '1px solid #ccc',
                                borderRadius: 4,
                                backgroundColor: '#fff',
                            }}
                        >
                            {/* Select de fornecedor */}
                            <FormControl sx={{ flex: 2 }}>
                                <InputLabel id={`fornecedor-${index}`}>Fornecedor</InputLabel>
                                <Select
                                    labelId={`fornecedor-${index}`}
                                    value={split.code}
                                    label="Fornecedor"
                                    onChange={(e) => {
                                        const updated = [...splits];
                                        updated[index].code = e.target.value;
                                        setSplits(updated);
                                    }}
                                    sx={{ borderRadius: 4 }}
                                >
                                    {fornecedores.map((f) => (
                                        <MenuItem key={f.code} value={f.code}>
                                            {f.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Valor — aparece só no modo Manual */}
                            {repasseType === 'manual' && (
                                <TextField
                                    label="Valor (R$)"
                                    type="number"
                                    value={split.value}
                                    onChange={(e) => {
                                        const updated = [...splits];
                                        updated[index].value = e.target.value;
                                        setSplits(updated);
                                    }}
                                    sx={{ flex: 1 }}
                                />
                            )}

                            {/* Taxa */}
                            <FormControl sx={{ flex: 1 }}>
                                <InputLabel id={`taxa-${index}`}>Taxa</InputLabel>
                                <Select
                                    labelId={`taxa-${index}`}
                                    value={split.chargeFees ? 'true' : 'false'}
                                    label="Taxa"
                                    onChange={(e) => {
                                        const updated = [...splits];
                                        updated[index].chargeFees = e.target.value === 'true';
                                        setSplits(updated);
                                    }}
                                    sx={{ borderRadius: 4 }}
                                >
                                    <MenuItem value="true">Fornecedor paga taxa</MenuItem>
                                    <MenuItem value="false">Loja paga taxa</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setSplits(splits.filter((_, i) => i !== index))}
                            >
                                Remover
                            </Button>
                        </Box>
                    ))}

                    {/* Botão adicionar fornecedor */}
                    <Button
                        variant="contained"
                        onClick={() =>
                            setSplits([...splits, { code: '', value: '', chargeFees: false }])
                        }
                        sx={{
                            alignSelf: 'flex-start',
                            borderRadius: 4,
                            backgroundColor: '#0071EB',
                            fontWeight: 600,
                            '&:hover': { backgroundColor: '#005bb5' },
                        }}
                    >
                        + Adicionar fornecedor
                    </Button>
                </Box>
            )}



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

                {/* Bandeira (mostra se houver modalidade) */}
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
