import {useEffect, useState} from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button, Snackbar, Alert, AlertColor, Typography,
} from '@mui/material';
import {brands} from '@/components/Brand';
import {useTransaction} from '@/contexts/TransactionContext';
import {maskCpfCnpj, onlyDigits, isCpfCnpjLenValid} from '@/utils/document';
import {parseApiError} from '@/utils/httpErrors';
import {regexEmail} from '@/utils/regex';
import axios from "axios";
import {getApiConfigFromCookies} from "@/utils/apiConfig";
import PinpadStatusPoller from "@/components/PinpadStatusPoller";

type OrderProps = {
    onConclude?: () => void;
};

export default function Pinpad({onConclude}: OrderProps) {
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
        callback,
        setCallback,
        clearCustomerData,
        resetTransaction,
    } = useTransaction();

    const amountFloat = parseFloat(amount || '0');
    const showInstallments = paymentType === 'credit';
    const showCustomerFields = paymentType === 'debit' || !!installments;
    const showSubmitButton = showCustomerFields;
    const filteredBrands = brands.filter((b) => b.type === paymentType);
    const [touchedName, setTouchedName] = useState(false);
    const [touchedDocument, setTouchedDocument] = useState(false);
    const [touchedEmail, setTouchedEmail] = useState(false);
    const [pinpadResult, setPinpadResult] = useState<any>(null);

    useEffect(() => {
        const config = getApiConfigFromCookies();
        if (config?.values?.callback) {
            setCallback(config.values.callback);
        }
    }, []);

    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    })

    const handleConclude = () => {
        resetTransaction();
        onConclude?.();
    };

    const checkTransactionStatus = async (transactionId: string) => {
        try {
            const response = await axios.get(`/api/proxy/pinpad/remote/status/${transactionId}`);
            return response.data?.status || 'PENDING';
        } catch (error) {
            console.error('Erro ao buscar status da transação:', error);
            return 'PENDING';
        }
    };

    const handleSubmit = async () => {
        const docDigits = onlyDigits(customerDocument);
        const validName = customerName && /^[A-Za-zÀ-ÿ\s]+$/.test(customerName);
        const validDoc = isCpfCnpjLenValid(docDigits);
        const validEmail = regexEmail.test(customerEmail);

        if (!validName || !validDoc || !validEmail) {
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'campos ausentes ou nao preenchidos',
                description: 'Preencha todos os campos corretamente antes de finalizar.'
            });
            return;
        }

        const token = await fetchBearerToken();
        if (!token) {
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'Erro ao obter o token.',
                description: 'Verifique suas credenciais.'
            });
            return;
        }

        const response = await postRemoteTransaction(token);
        if (response?.success === 'true') {
            setPinpadResult({
                transactionId: response.transactionId,
                customerName,
                customerDocument,
                amount: amountFloat,
                installments,
                payment: amountFloat / parseInt(installments || '1'),
                callback,
            });

        } else {
            setSnackbar({
                open: true,
                severity: 'error',
                title: 'Erro ao criar a transação.',
                description: 'Verifique suas credenciais.'
            });
        }
    };

    const fetchBearerToken = async () => {
        try {
            const config = getApiConfigFromCookies(); // ← pega ambiente, url, apiKey, merchantKey

            const body = {
                auth: {
                    username: config.values.apiKey,
                    apiKey: config.values.apiSecret,
                },
            };

            const response = await axios.post(`/api/proxy/pinpad/remote/token`, body);
            return response.data?.Bearer || null;
        } catch (err) {
            const {title, description} = parseApiError(err);
            setSnackbar({
                open: true,
                severity: 'error',
                title,
                description,
            });
            return null;
        }
    };

    const postRemoteTransaction = async (token: string) => {
        try {
            const config = getApiConfigFromCookies();

            const payload = {
                transaction: {
                    merchantId: config.values.merchantKey,
                    value: amount,
                    installments: parseInt(installments),
                    clientName: customerName,
                    clientEmail: customerEmail,
                    paymentBrand: cardBrand,
                    callbackUrl: callback,
                },
            };

            const headers = {
                bearer: token,
                'Content-Type': 'application/json',
            };

            const response = await axios.post(`/api/proxy/pinpad/remote/transaction`, payload, {headers});
            return response.data;
        } catch (error) {
            const {title, description} = parseApiError(error);
            setSnackbar({
                open: true,
                severity: 'error',
                title,
                description,
            });
            return null;
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
            <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', gap: 2}}>


                <Box sx={{display: 'flex', flexDirection: 'row', gap: 2}}>

                    {/*Payment Type + Brand + Installments*/}
                    <Box sx={{width: '20%', minWidth: 110}}>
                        <FormControl fullWidth>
                            <InputLabel id="payment-type-label">Função</InputLabel>
                            <Select
                                sx={{bgcolor: '#fff'}}
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
                        <Box sx={{width: '36%', minWidth: 180, maxWidth: 180}}>
                            <FormControl fullWidth>
                                <InputLabel id="card-brand-label">Bandeira</InputLabel>
                                <Select
                                    sx={{bgcolor: '#fff'}}
                                    labelId="card-brand-label"
                                    value={cardBrand || ''}
                                    onChange={(e) => setCardBrand(e.target.value)}
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
                        </Box>
                    )}

                    {showInstallments && (
                        <Box sx={{width: '36%', minWidth: 180, maxWidth: 180}}>
                            <FormControl fullWidth>
                                <InputLabel id="installments-label">Parcelamento</InputLabel>
                                <Select
                                    sx={{bgcolor: '#fff'}}
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

                {/* Campos do Cliente */}
                {showCustomerFields && (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, minWidth: 500}}>
                        <TextField
                            label="Nome"
                            sx={{backgroundColor: '#FFF'}}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            onBlur={() => setTouchedName(true)}
                            error={touchedName && (!customerName || !/^[A-Za-zÀ-ÿ\s]+$/.test(customerName))}
                        />

                        <TextField
                            label="Documento"
                            sx={{bgcolor: '#fff'}}
                            value={customerDocument}
                            onChange={(e) => setCustomerDocument(maskCpfCnpj(e.target.value))}
                            onBlur={() => setTouchedDocument(true)}
                            error={touchedDocument && !isCpfCnpjLenValid(onlyDigits(customerDocument))}
                        />

                        <TextField
                            label="Email"
                            sx={{bgcolor: '#fff'}}
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            onBlur={() => setTouchedEmail(true)}
                            error={touchedEmail && !regexEmail.test(customerEmail)}
                        />
                    </Box>
                )}

                {showSubmitButton && (
                    <Box sx={{display: 'flex', gap: 2, mt: 2}}>
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
                                '&:hover': {backgroundColor: '#0071EB'},
                            }}
                            onClick={handleSubmit}
                        >
                            Finalizar
                        </Button>
                    </Box>
                )}
            </Box>
            {/* Coluna da direita: resultado */}
            {pinpadResult && (
                <Box sx={{ml: 20, height: 'fit-content', alignSelf: 'flex-start'}}>
                    <PinpadStatusPoller transactionId={pinpadResult.transactionId}/>
                </Box>

            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((prev) => ({...prev, open: false}))}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({...prev, open: false}))}
                    severity={snackbar.severity as AlertColor}
                    sx={{width: '100%'}}
                >
                    <Typography variant="subtitle1" fontWeight="bold">
                        {snackbar.title}
                    </Typography>
                    <Typography
                        sx={{whiteSpace: 'pre-line'}}
                        variant="body2">{snackbar.description}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}
