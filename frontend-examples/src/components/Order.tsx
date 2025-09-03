import {useState} from 'react';
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
import axios from 'axios';

import {useTransaction} from '@/contexts/TransactionContext';
import {brands} from './Brand';
import {getApiConfigFromCookies, buildBasicAuthHeader} from '@/utils/apiConfig';
import {maskCpfCnpj, onlyDigits, isCpfCnpjLenValid} from '@/utils/document';
import {isNameValid} from '@/utils/nameValidation';
import {parseApiError} from '@/utils/httpErrors';

type OrderResult = {
    payUrl: string;
    uuid: string;
    customerName?: string;
    customerDocument?: string;
    amount?: string;
    installments?: string;
} | null;

type OrderProps = {
    onConclude?: () => void;

    onResultChange?: (r: OrderResult) => void;
    onStatusChange?: (s: 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED') => void;
    onPaymentChange?: (v: number) => void;
};

export default function Order({onResultChange, onStatusChange, onPaymentChange,}: OrderProps) {
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
    } = useTransaction();

    const amountFloat = parseFloat(amount || '0');
    const showBrand = !!amount;
    const showInstallments = showBrand && !!cardBrand;
    const showCustomerFields = showInstallments && !!installments;
    const creditBrands = brands.filter((b) => b.type === 'credit');

    const [docTouched, setDocTouched] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    });

    const handleSubmit = async () => {
        try {
            const cfg = getApiConfigFromCookies();
            const headers = buildBasicAuthHeader(cfg);

            if (!amountFloat || amountFloat <= 0) {
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Valor inválido',
                    description: 'Informe um valor maior que zero.',
                });
                return;
            }
            if (!installments) {
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Parcelamento',
                    description: 'Selecione o parcelamento.',
                });
                return;
            }
            if (!cfg.values?.merchantKey) {
                setSnackbar({
                    open: true,
                    severity: 'error',
                    title: 'Credenciais',
                    description: 'Chave de Integração do Estabelecimento ausente.',
                });
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

            const res = await axios.post(`${cfg.url}/api/orders`, payload, {
                headers,
            });

            if (res.status >= 400) {
                const ui = parseApiError({response: res} as any);
                setSnackbar({open: true, severity: 'error', title: ui.title, description: ui.description});
                return;
            }

            const {payUrl, uuid} = res.data;

            onResultChange?.({
                payUrl,
                uuid,
                customerName,
                customerDocument,
                amount: amountFloat.toFixed(2),
                installments,
            });

            onStatusChange?.('PENDING');

            onPaymentChange?.(0);
        } catch (error) {
            const ui = parseApiError(error);
            setSnackbar({open: true, severity: 'error', title: ui.title, description: ui.description});
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
            {/* Linha Bandeiras / Parcelamento */}
            <Box sx={{display: 'flex', flexDirection: 'row', gap: 2}}>
                {showBrand && (
                    <Box sx={{width: '50%', minWidth: 200}}>
                        <FormControl fullWidth>
                            <InputLabel>Bandeiras</InputLabel>
                            <Select
                                value={cardBrand || ''}
                                onChange={(e) => setCardBrand(e.target.value)}
                                sx={{borderRadius: 4, backgroundColor: '#fff'}}
                            >
                                {creditBrands.map((b) => (
                                    <MenuItem key={b.value} value={b.value}>
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                            <img src={b.images} alt={b.label}
                                                 style={{width: 24, height: 16, marginRight: 8}}/>
                                            {b.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {showInstallments && (
                    <Box sx={{width: '50%', minWidth: 200}}>
                        <FormControl fullWidth>
                            <InputLabel>Parcelamento</InputLabel>
                            <Select
                                value={installments}
                                sx={{borderRadius: 4, backgroundColor: '#fff'}}
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
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, minWidth: 500}}>
                    <TextField
                        label="Nome"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={() => setNameTouched(true)}
                        error={nameTouched && !isNameValid(customerName)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 4,
                                backgroundColor: '#FFF',
                            }
                        }}
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
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 4,
                                backgroundColor: '#FFF',
                            }
                        }}
                    />
                </Box>
            )}

            {/* Botões */}
            {showCustomerFields && (
                <Box sx={{display: 'flex', gap: 2, mt: 1}}>
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
                            setNameTouched(false);
                            setDocTouched(false);
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
                            '&:hover': {backgroundColor: '#0071EB'},
                        }}
                        onClick={handleSubmit}
                    >
                        Finalizar
                    </Button>
                </Box>
            )}

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
                    <Typography sx={{whiteSpace: 'pre-line'}} variant="body2">
                        {snackbar.description}
                    </Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}
