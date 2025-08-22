import { useState, useEffect } from 'react';
import {Box, Button, TextField, Typography} from '@mui/material';
import Pinpad from '@/components/Pinpad';
import POS from '@/components/Pos';
import Order from "@/components/Order";
import CurrencyInput from '@/components/CurrencyInput';
import { useTransaction } from '@/contexts/TransactionContext';
import { Store, CreditCard, Link } from 'lucide-react';


export default function TransactionsPage() {
    const [value, setValue] = useState('');
    const [rawValue, setRawValue] = useState(0);
    const [errorValue, setErrorValue] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [PaymentMethods, setPaymentMethods] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    const { setAmount, resetTransaction } = useTransaction();

    const resetSaleUI = () => {
        resetTransaction();
        setValue('');
        setRawValue(0);
        setErrorValue(false);
        setErrorMessage('');
        setPaymentMethods(false);
        setSelectedProduct(null);
    };

    const methodLabels: Record<string, string> = {
        order: 'Link',
        pinpad: 'Pinpad',
        pos: 'POS',
    };

    const handleCalculate = () => {
        if (rawValue > 0 && !errorValue) {
            setAmount(rawValue.toFixed(2));
            setPaymentMethods(true);
        }
    };

    return (

        <Box sx={{
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',

            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
        }}>
        <Box
            sx={{
                borderRadius: 2,
                padding: 3,
                maxWidth: 1200,
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
            }}
        >

            <Typography
                sx={{
                    fontWeight: 700,
                    fontSize: '40px',
                    lineHeight: '56px',
                    color: '#204986',
                }}
            >
                Nova Venda
            </Typography>

            {/* Input e botão lado a lado */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 2,
                }}
            >
                <CurrencyInput
                    value={value}
                    onChange={(formatted, raw) => {
                        setValue(formatted);
                        setRawValue(raw);
                        if (raw <= 0) {
                            setErrorValue(true);
                            setErrorMessage('Informe um valor válido');
                        } else {
                            setErrorValue(false);
                            setErrorMessage('');
                        }
                    }}
                    error={errorValue}
                    helperText={errorMessage}
                />

                <Button
                    variant="contained"
                    sx={{
                        flex: 1,
                        backgroundColor:'#0071EB',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '16px',
                        textTransform: 'none',
                        borderRadius: '16px',
                        minWidth: '150px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        paddingY: '15px',
                        '&:hover': {
                            backgroundColor:'#0071EB',
                        },
                    }}
                    onClick={handleCalculate}
                    disabled={errorValue || value.trim() === ''}
                >
                    Calcular
                </Button>
            </Box>


            {/* Métodos de pagamento */}
            {PaymentMethods && (
                <Box
                    sx={{
                        display: 'flex',
                        backgroundColor: '#DDE2E7',
                        borderRadius: '20px',
                        padding: '8px',
                        gap: 1,
                        width: '50%',
                        maxWidth: '500px',
                        minWidth: '300px',
                        justifyContent: 'space-between',
                    }}
                >
                    {['order', 'pinpad', 'pos'].map((method) => {
                        const isActive = selectedProduct === method;
                        const label = methodLabels[method];
                        const Icon = method === 'order' ? Link : method === 'pinpad' ? Store : CreditCard;

                        return (
                            <Button
                                key={method}
                                onClick={() => setSelectedProduct(method)}
                                disableRipple
                                sx={{
                                    flex: 1,
                                    backgroundColor: isActive ? '#0071EB' : 'transparent',
                                    color: isActive ? '#FFF' : '#1C1C1C',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    display: '',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    paddingY: '10px',
                                    '&:hover': {
                                        backgroundColor: isActive ? '#0071EB' : '#DDE2E7',
                                    },
                                }}
                            >
                                <Icon size={18} />
                                {label}
                            </Button>
                        );
                    })}
                </Box>
            )}

            {selectedProduct === 'order' && (
                <Order onConclude={resetSaleUI} />
            )}

            {selectedProduct === 'pinpad' && (
                <Pinpad />
            )}

            {selectedProduct === 'pos' && (
                <POS/>
            )}
        </Box>
        </Box>
    );
}
