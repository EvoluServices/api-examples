import { useState, useMemo } from 'react';
import {
    Box,
    Button,
    TextField,
    Snackbar,
    Alert,
    AlertColor,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import axios from 'axios';
import { useTransaction } from '@/contexts/TransactionContext';
import { parseApiError } from '@/utils/httpErrors';
import { maskCpfCnpj, onlyDigits } from '@/utils/document';

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
    autoSubmitNonce?: number;
    onResultChange?: (r: OrderResult) => void;
    onStatusChange?: (s: 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED') => void;
    onPaymentChange?: (v: number) => void;
};

export default function Order({
                                  autoSubmitNonce,
                                  onResultChange,
                                  onStatusChange,
                                  onPaymentChange,
                              }: OrderProps) {
    const {
        amount,
        installments,
        setInstallments,
        customerName,
        setCustomerName,
        customerDocument,
        setCustomerDocument,
    } = useTransaction();

    const [linkMode, setLinkMode] = useState<'UNICO' | 'RECORRENTE' | ''>('');
    const [recurrenceType, setRecurrenceType] = useState<'MENSAL' | 'FLEXIVEL' | ''>('');
    const [recurrenceQuantity, setRecurrenceQuantity] = useState('');
    const [recurrenceDays, setRecurrenceDays] = useState('');

    const [snackbar, setSnackbar] = useState({
        open: false,
        severity: 'error' as AlertColor,
        title: '',
        description: '',
    });

    const amountFloat = parseFloat(amount || '0');
    const showCustomerFields = !!amount && !!linkMode;

    const resetRecurrence = () => {
        setRecurrenceType('');
        setRecurrenceQuantity('');
        setRecurrenceDays('');
    };

    const parcelasOptions = useMemo(() => {
        if (!amountFloat) return [];
        const maxParcelas = 12;
        const arr = [];
        for (let i = 1; i <= maxParcelas; i++) {
            const valorParcela = amountFloat / i;
            arr.push({ value: i.toString(), label: `${i}x de R$ ${valorParcela.toFixed(2)}` });
        }
        return arr;
    }, [amountFloat]);

    const handleSubmit = async () => {
        try {
            if (!amountFloat || amountFloat <= 0) {
                setSnackbar({ open: true, severity: 'error', title: 'Valor inválido', description: 'Informe um valor maior que zero.' });
                return;
            }
            if (!linkMode) {
                setSnackbar({ open: true, severity: 'error', title: 'Modo do link', description: 'Selecione se será Link de Pagamento ou Recorrência.' });
                return;
            }
            if (linkMode === 'RECORRENTE') {
                if (!recurrenceType) {
                    setSnackbar({ open: true, severity: 'error', title: 'Recorrência', description: 'Selecione o tipo de recorrência.' });
                    return;
                }
                if (!recurrenceQuantity || Number(recurrenceQuantity) <= 0) {
                    setSnackbar({ open: true, severity: 'error', title: 'Recorrência', description: 'Informe a quantidade de cobranças.' });
                    return;
                }
                if (recurrenceType === 'FLEXIVEL' && (!recurrenceDays || Number(recurrenceDays) <= 0)) {
                    setSnackbar({ open: true, severity: 'error', title: 'Recorrência', description: 'Informe a quantidade de dias entre as cobranças.' });
                    return;
                }
            }

            const meResp = await axios.get('/api/session/me');
            const merchantKey: string | undefined = meResp?.data?.merchantKey;
            if (!merchantKey) {
                setSnackbar({ open: true, severity: 'error', title: 'Credenciais', description: 'Chave do estabelecimento ausente. Faça login novamente.' });
                return;
            }

            const orderPayload: any = {
                reference: '123CLIENTS',
                amount: String(Math.round(amountFloat * 100)),
                merchantCode: merchantKey,
                description: 'Venda de equipamento',
                customerName,
                customerDocument,
                recurrent: linkMode === 'RECORRENTE',
            };

            if (linkMode === 'UNICO') {
                const nInstallments = parseInt(installments || '1', 10);
                orderPayload.minInstallments = String(nInstallments);
                orderPayload.maxInstallments = String(nInstallments);
            } else if (linkMode === 'RECORRENTE') {
                orderPayload.recurrenceType = recurrenceType === 'MENSAL' ? 'MONTHLY' : 'FLEXIBLE';
                orderPayload.quantityCharges = recurrenceQuantity || '1';
                orderPayload.minInstallments = 1;
                orderPayload.maxInstallments = 1;
                if (recurrenceType === 'FLEXIVEL') {
                    orderPayload.frequency = recurrenceDays || '30';
                }
            }

            const payload = { order: orderPayload };
            const res = await axios.post('/api/proxy/order/api/orders', payload);
            const { payUrl, uuid } = res.data;

            onResultChange?.({ payUrl, uuid, customerName, customerDocument, amount: amountFloat.toFixed(2), installments });
            onStatusChange?.('PENDING');
            onPaymentChange?.(0);
        } catch (error) {
            const ui = parseApiError(error);
            setSnackbar({ open: true, severity: 'error', title: ui.title, description: ui.description });
        }
    };

    const handleClear = () => {
        setCustomerName('');
        setCustomerDocument('');
        setInstallments('');
        resetRecurrence();
    };

    const SegmentedButton = ({
                                 selected,
                                 label,
                                 onClick,
                             }: {
        selected: boolean;
        label: string;
        onClick: () => void;
    }) => (
        <Box
            onClick={onClick}
            sx={{
                flex: 1,
                borderRadius: 4,
                minHeight: 60,
                border: '1px solid #0071EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: '#fff',
                fontWeight: 700,
                textTransform: 'uppercase', // <-- garante maiúsculas
                '&:hover': { backgroundColor: '#f0f7ff' },
            }}
        >
            <Box
                sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '2px solid #0071EB',
                    backgroundColor: selected ? '#0071EB' : 'transparent',
                    marginRight: 1.5,
                    transition: 'all 0.2s',
                }}
            />
            <Typography
                sx={{ fontWeight: 700, color: '#0071EB', textTransform: 'uppercase', fontSize: '14px' }}
            >
                {label.toUpperCase()} {/* <-- aqui força o label em maiúsculo */}
            </Typography>
        </Box>
    );


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Botões Link / Recorrência */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant={linkMode === 'UNICO' ? 'contained' : 'outlined'}
                    onClick={() => { setLinkMode('UNICO'); resetRecurrence(); }}
                    sx={{
                        flex: 1,
                        minHeight: 60,
                        borderRadius: 4,
                        backgroundColor: linkMode === 'UNICO' ? '#0071EB' : '#fff',
                        color: linkMode === 'UNICO' ? '#fff' : '#0071EB',
                        border: '1px solid #0071EB',
                        fontWeight: 700,
                        fontSize: '14px',
                        '&:hover': { backgroundColor: linkMode === 'UNICO' ? '#005bb5' : '#f0f7ff' },
                    }}
                >
                    Link de Pagamento
                </Button>
                <Button
                    variant={linkMode === 'RECORRENTE' ? 'contained' : 'outlined'}
                    onClick={() => setLinkMode('RECORRENTE')}
                    sx={{
                        flex: 1,
                        minHeight: 60,
                        borderRadius: 4,
                        backgroundColor: linkMode === 'RECORRENTE' ? '#0071EB' : '#fff',
                        color: linkMode === 'RECORRENTE' ? '#fff' : '#0071EB',
                        border: '1px solid #0071EB',
                        fontWeight: 700,
                        fontSize: '14px',
                        '&:hover': { backgroundColor: linkMode === 'RECORRENTE' ? '#005bb5' : '#f0f7ff' },
                    }}
                >
                    Recorrência
                </Button>
            </Box>

            {/* Tipo de recorrência */}
            {linkMode === 'RECORRENTE' && (
                <Box display="flex" gap={2}>
                    <SegmentedButton
                        selected={recurrenceType === 'MENSAL'}
                        label="Mensal"
                        onClick={() => setRecurrenceType('MENSAL')}
                    />
                    <SegmentedButton
                        selected={recurrenceType === 'FLEXIVEL'}
                        label="Flexível"
                        onClick={() => setRecurrenceType('FLEXIVEL')}
                    />
                </Box>
            )}

            {/* Campos recorrência */}
            {recurrenceType === 'MENSAL' && (
                <TextField
                    label="Quantidade de cobranças"
                    type="number"
                    value={recurrenceQuantity}
                    onChange={(e) => setRecurrenceQuantity(e.target.value)}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#fff',
                            borderRadius: 4,
                            minHeight: 60,
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 500,
                            padding: '0 14px',
                        },
                        '& .MuiInputLabel-root': { fontWeight: 500 },
                    }}
                />
            )}
            {recurrenceType === 'FLEXIVEL' && (
                <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                        label="Quantidade de dias"
                        type="number"
                        value={recurrenceDays}
                        onChange={(e) => setRecurrenceDays(e.target.value)}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: 4,
                                minHeight: 60,
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                padding: '0 14px',
                                fontSize: '14px'
                            },
                            '& .MuiInputLabel-root': { fontWeight: 500 },
                        }}
                    />
                    <TextField
                        label="Quantidade de cobranças"
                        type="number"
                        value={recurrenceQuantity}
                        onChange={(e) => setRecurrenceQuantity(e.target.value)}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: 4,
                                minHeight: 60,
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                padding: '0 14px',
                            },
                            '& .MuiInputLabel-root': { fontWeight: 500 },
                        }}
                    />
                </Box>
            )}

            {/* Parcelamento */}
            {linkMode === 'UNICO' && (
                <FormControl fullWidth>
                    <InputLabel>Parcelamento</InputLabel>
                    <Select
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        label="Parcelamento"
                        sx={{
                            borderRadius: 4,
                            minHeight: 60,
                            backgroundColor: '#fff',
                            fontWeight: 500,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 14px',
                                fontWeight: 500,
                            },
                            '& .MuiInputLabel-root': { fontWeight: 500 },
                        }}
                    >
                        {parcelasOptions.map((p) => (
                            <MenuItem key={p.value} value={p.value}>
                                {p.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* Campos Cliente */}
            {showCustomerFields && (
                <Box display="flex" flexDirection="column" gap={2} mt={2}>
                    <TextField
                        label="Nome do Cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: 4,
                                minHeight: 60,
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                padding: '0 14px',
                            },
                            '& .MuiInputLabel-root': { fontWeight: 500 },
                        }}
                    />
                    <TextField
                        label="CPF/CNPJ do Cliente"
                        value={maskCpfCnpj(customerDocument)}
                        onChange={(e) => setCustomerDocument(onlyDigits(e.target.value).slice(0, 14))}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: 4,
                                minHeight: 60,
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                padding: '0 14px',
                            },
                            '& .MuiInputLabel-root': { fontWeight: 500 },
                        }}
                    />
                </Box>
            )}

            {/* Botões */}
            {showCustomerFields && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                        onClick={handleClear}
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
                    >
                        Limpar
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        sx={{
                            flex: 1,
                            backgroundColor: '#0071EB',
                            color: '#FFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            textTransform: 'none',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            py: '10px',
                            '&:hover': { backgroundColor: '#0071EB' },
                        }}
                    >
                        GERAR LINK
                    </Button>
                </Box>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold">{snackbar.title}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{snackbar.description}</Typography>
                </Alert>
            </Snackbar>
        </Box>
    );
}
