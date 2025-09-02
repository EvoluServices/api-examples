import {useState, useEffect} from 'react';
import {Box, Button, Typography} from '@mui/material';
import CurrencyInput from '@/components/CurrencyInput';
import Pinpad from '@/components/Pinpad';
import POS from '@/components/Pos';
import Order from '@/components/Order';
import OrderSuccessResult from '@/components/order/OrderSuccessResult';
import OrderRejectedResult from '@/components/order/OrderRejectedResult';
import OrderGenericErrorResult from '@/components/order/OrderGenericErrorResult';
import {useTransaction} from '@/contexts/TransactionContext';
import {Store, CreditCard, Link as LinkIcon} from 'lucide-react';
import OrderLinkResult from "@/components/order/OrderLinkResult";
import {buildBasicAuthHeader, getApiConfigFromCookies} from "@/utils/apiConfig";
import axios from "axios";
import EmptyStateMessage from "@/components/EmptyStateMessage";

type OrderResult = {
    payUrl: string;
    uuid: string;
    customerName?: string;
    customerDocument?: string;
    amount?: string;
    installments?: string;
} | null;

type ProductKey = 'order' | 'pinpad' | 'pos';

export default function TransactionsPage() {
    const [value, setValue] = useState('');
    const [rawValue, setRawValue] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductKey | null>(null);
    const {setAmount, resetTransaction, customResetTransaction} = useTransaction();
    const [orderResult, setOrderResult] = useState<OrderResult>(null);
    const [orderStatus, setOrderStatus]
            = useState<'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'PROCESSING' | 'ABORTED'>('PENDING');
    const [payment, setPayment] = useState<number>(0);
    const resetSaleUI = () => {
        resetTransaction();
        setValue('');
        setRawValue(0);
        setPaymentMethods(false);
        setSelectedProduct(null);
        setOrderResult(null);
        setOrderStatus('PENDING');
        setPayment(0);
    };

    const methodLabels: Record<string, string> = {
        order: 'Link',
        pinpad: 'Pinpad',
        pos: 'POS',
    };

    const handleCalculate = () => {
        if (rawValue > 0) {
            setAmount(rawValue.toFixed(2));
            setPaymentMethods(true);
        }
    };

    useEffect(() => {
        if (selectedProduct !== null) {
            customResetTransaction();
            setPaymentMethods(true);
        }
    }, [selectedProduct]);

    function sumPayments(orderData: any): number {
        if (!orderData?.transactionList) return 0;
        const cents = orderData.transactionList.reduce((total: number, t: any) => {
            const pCents = (t.payments || []).reduce((acc: number, p: any) => {
                const v = typeof p.amount === 'string' ? p.amount.replace(',', '.') : String(p.amount);
                return acc + Math.round(parseFloat(v) * 100);
            }, 0);
            return total + pCents;
        }, 0);
        return cents / 100;
    }

    useEffect(() => {
        if (!orderResult?.uuid || TERMINAL.includes(orderStatus as any)) return;

        let cancelled = false;
        const cfg = getApiConfigFromCookies();
        const headers = buildBasicAuthHeader(cfg);

        const poll = async () => {
            try {
                const {data} = await axios.get(`${cfg.url}/api/orders/${orderResult.uuid}`, {headers});

                const totalPayments = sumPayments(data);
                setPayment(totalPayments);

                const newStatus = mapStatus(data);
                setOrderStatus(newStatus as any);

                if (TERMINAL.includes(newStatus as any)) {
                    clearInterval(timer);
                }
            } catch (e) {
            }
        };

        poll();
        const timer = setInterval(poll, 10000); // 10s

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [orderResult?.uuid, orderStatus]);

    function mapStatus(api: any): 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'PROCESSING' {
        const s: string = (api?.status || api?.orderStatus || '').toUpperCase();

        if (s.includes('APPROVED')) return 'APPROVED';
        if (s.includes('DISAPPROVED') || s.includes('DENIED') || s.includes('REJECT')) return 'DISAPPROVED';
        if (s.includes('ABORTED') || s.includes('CANCELED') || s.includes('CANCELLED')) return 'ABORTED';
        if (s.includes('PROCESSING')) return 'PROCESSING';
        return 'PENDING';
    }

    const TERMINAL: Array<'APPROVED' | 'DISAPPROVED' | 'ABORTED'> = ['APPROVED', 'DISAPPROVED', 'ABORTED'];

    return (
        <Box sx={{width: '100%', px: 2, pt: 2, display: 'flex', justifyContent: 'center'}}>

            <Box sx={{display: 'flex', width: '100%', maxWidth: 'min(1400px, 90vw)', alignItems: 'flex-start'}}>
                {/* COLUNA ESQUERDA */}
                <Box sx={{flex: 1, maxWidth: 560, ml: 5, mt: 3}}>
                    <Typography sx={{fontWeight: 700, fontSize: 40, lineHeight: '56px', color: '#204986', mb: 2}}>
                        Nova Venda
                    </Typography>

                    {/* VALOR + CALCULAR */}
                    <Box sx={{display: 'flex', gap: 1, mb: 2, width: '100%'}}>
                        <Box sx={{flex: 1.5}}>
                            <CurrencyInput
                                value={value}
                                onChange={(formatted, raw) => {
                                    setValue(formatted);
                                    setRawValue(raw);
                                    if (!formatted || raw <= 0) {
                                        setPaymentMethods(false);
                                        customResetTransaction();
                                        setSelectedProduct(null);
                                    }
                                }}
                            />
                        </Box>

                        <Button
                            variant="contained"
                            onClick={handleCalculate}
                            disabled={!rawValue || rawValue <= 0}
                            sx={{
                                width: 180,
                                backgroundColor: '#0071EB',
                                color: '#FFF',
                                fontWeight: 700,
                                fontSize: '16px',
                                textTransform: 'none',
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                paddingY: '10px',
                                '&:hover': {backgroundColor: '#0071EB'},
                            }}
                        >
                            Calcular
                        </Button>
                    </Box>

                    {/* MÉTODOS */}
                    {paymentMethods && (
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                backgroundColor: '#DDE2E7',
                                borderRadius: 4,
                                p: 1,
                                gap: 1,
                                mb: 3,
                            }}
                        >
                            {(['order', 'pinpad', 'pos'] as const).map((method) => {
                                const label = methodLabels[method];
                                const isActive = selectedProduct === method;
                                const Icon = method === 'order' ? LinkIcon : method === 'pinpad' ? Store : CreditCard;
                                return (
                                    <Button
                                        key={method}
                                        onClick={() => setSelectedProduct(method)}
                                        disableRipple
                                        sx={{
                                            flex: 1,
                                            borderRadius: 4,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            minHeight: 54,
                                            backgroundColor: isActive ? '#0071EB' : 'transparent',
                                            color: isActive ? '#FFF' : '#1C1C1C',
                                            '&:hover': {backgroundColor: isActive ? '#0071EB' : '#DDE2E7'},
                                        }}
                                    >
                                        <Icon size={18} style={{marginRight: 8}}/>
                                        {label}
                                    </Button>
                                );
                            })}
                        </Box>
                    )}

                    {/* FORMULÁRIOS */}
                    {selectedProduct === 'order' && (
                        <Order
                            onConclude={resetSaleUI}
                            onResultChange={setOrderResult}
                            onStatusChange={setOrderStatus}
                            onPaymentChange={setPayment}
                        />
                    )}
                    {selectedProduct === 'pinpad' && <Pinpad onConclude={resetSaleUI}/>}
                    {selectedProduct === 'pos' && <POS onConclude={resetSaleUI}/>}
                </Box>

                {/* COLUNA DIREITA */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '80vh',
                        px: 2,
                    }}
                >
                    <Box sx={{textAlign: 'center'}}>
                        {orderResult ? (
                            <>
                                {orderStatus === 'APPROVED' && (
                                    <OrderSuccessResult
                                        customerName={orderResult.customerName || ''}
                                        customerDocument={orderResult.customerDocument || ''}
                                        amount={Number(orderResult.amount || 0)}
                                        installments={orderResult.installments || '1'}
                                        payment={payment}
                                        onConclude={resetSaleUI}
                                    />
                                )}

                                {orderStatus === 'DISAPPROVED' && <OrderRejectedResult/>}

                                {orderStatus === 'PROCESSING' && <OrderGenericErrorResult/>}

                                {(orderStatus === 'PENDING' || orderStatus === 'ABORTED') && (
                                    <OrderLinkResult payUrl={orderResult?.payUrl}/>
                                )}
                            </>
                        ) : (
                            selectedProduct ? (
                                <EmptyStateMessage product={selectedProduct as ProductKey}/>
                            ) : null
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
