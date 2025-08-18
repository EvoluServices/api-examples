import { useState, useEffect } from 'react';
import {Box, Button, TextField, Typography} from '@mui/material';
import Pinpad from '@/components/Pinpad';
import POS from '@/components/Pos';
import Order from "@/components/Order";
import CurrencyInput from '@/components/CurrencyInput';
import { useTransaction } from '@/contexts/TransactionContext';

export default function TransactionsPage() {
    const [value, setValue] = useState('');
    const [rawValue, setRawValue] = useState(0);
    const [errorValue, setErrorValue] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [PaymentMethods, setPaymentMethods] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    const { setAmount } = useTransaction();

    const methodLabels: Record<string, string> = {
        order: 'Order',
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
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingTop: 4,
                paddingX: 3,
            }}
        >
            <Typography
                sx={{
                    fontWeight: 700,
                    fontSize: "40px",
                    lineHeight: "56px",
                    color: "#204986",
                    mb: 1,
                }}
            >
                Nova Venda
            </Typography>
            <Box
                sx={{
                    borderRadius: 2,
                    padding: 3,
                    maxWidth: 1000,
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#f5f5f5',
                }}
            >

                {/* Campo valor + botão calcular */}
                <Box
                    sx={{
                        padding: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        marginBottom: 2,
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
                        disableElevation
                        sx={{
                            width: '200px',
                            height: '40px',
                            backgroundColor: '#004e93',
                            color: 'white',
                            borderRadius: '30px',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#0056a6',
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
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        {['order', 'pinpad', 'pos'].map((method) => {
                            const isActive = selectedProduct === method;
                            return (
                                <Button
                                    key={method}
                                    variant="contained"
                                    disableElevation
                                    sx={{
                                        width: '190px',
                                        height: '40px',
                                        backgroundColor: isActive ? '#004e93' : '#0056a6',
                                        color: 'white',
                                        borderRadius: '30px',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold',
                                        borderBottom: isActive ? '3px solid #fff' : '3px solid transparent',
                                        boxShadow: isActive ? 'inset 0 -3px 0 #fff' : undefined,
                                        '&:hover': {
                                            backgroundColor: '#0056a6',
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedProduct(method);
                                    }}
                                >
                                    {methodLabels[method]}
                                </Button>
                            );
                        })}
                    </Box>
                )}

                {selectedProduct === 'order' && (
                    <Order/>
                )}

                {selectedProduct === 'pinpad' && (
                    <Pinpad/>
                )}

                {selectedProduct === 'pos' && (
                    <POS/>
                )}
            </Box>
        </Box>
    );
}
