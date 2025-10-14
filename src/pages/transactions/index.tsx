import {useState, useEffect} from 'react';
import {Box, Button, Typography} from '@mui/material';
import CurrencyInput from '@/components/CurrencyInput';
import Pinpad from '@/components/Pinpad';
import POS from '@/components/Pos';
import Order from '@/components/Order';
import SuccessResult from '@/components/results/SuccessResult';
import RejectedResult from '@/components/results/RejectedResult';
import GenericErrorResult from '@/components/results/GenericErrorResult';
import {useTransaction} from '@/contexts/TransactionContext';
import {Store, CreditCard, Link as LinkIcon} from 'lucide-react';
import OrderLinkResult from "@/components/order/OrderLinkResult";
import axios from "axios";
import EmptyStateMessage from "@/components/EmptyStateMessage";
import PinpadResult from "@/components/pinpad/PinpadResult";
import PosResult from "@/components/pos/PosResult";

type TxResult = {
    payUrl?: string;
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
    const [selectedProduct, setSelectedProduct]
        = useState<ProductKey | null>(null);
    const {setAmount, resetTransaction, customResetTransaction} = useTransaction();
    const [trxResult, setTrxResult] = useState<TxResult>(null);
    const [trxStatus, setTrxStatus] =
        useState<'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'PROCESSING' | 'ABORTED' | 'ERROR'>('PENDING');
    const [autoSubmitNonce, setAutoSubmitNonce] = useState(0);
    const [payment, setPayment] = useState<number>(0);
    const resetSaleUI = () => {
        resetTransaction();
        setValue('');
        setRawValue(0);
        setPaymentMethods(false);
        setSelectedProduct(null);
        setTrxResult(null);
        setTrxStatus('PENDING');
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
            setTrxResult(null);
            setTrxStatus('PENDING');
            setPayment(0);
            setAutoSubmitNonce((n) => n + 1);
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
        if (!trxResult?.uuid || selectedProduct !== 'order' || TERMINAL.includes(trxStatus as any)) return;

        const poll = async () => {
            try {
                const { data } = await axios.get(`/api/proxy/order/api/orders/${trxResult.uuid}`);
                const totalPayments = sumPayments(data);
                setPayment(totalPayments);
                const newStatus = mapStatus(data);
                setTrxStatus(newStatus as any);
                if (TERMINAL.includes(newStatus as any)) clearInterval(timer);
            } catch (e) {
                console.warn('Falha ao consultar status da ordem via proxy:', e);
            }
        };

        poll();
        const timer = setInterval(poll, 10000); //Executa a cada 10 segundos
        return () => clearInterval(timer);
    }, [trxResult?.uuid, trxStatus, selectedProduct]);

    function mapStatus(api: any): 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'PROCESSING' {
        const s: string = (api?.status || api?.orderStatus || '').toUpperCase();

        if (s.includes('APPROVED')) return 'APPROVED';
        if (s.includes('DISAPPROVED') || s.includes('DENIED') || s.includes('REJECT')) return 'DISAPPROVED';
        if (s.includes('ABORTED') || s.includes('CANCELED') || s.includes('CANCELLED')) return 'ABORTED';
        if (s.includes('PROCESSING')) return 'PROCESSING';
        return 'PENDING';
    }

    const TERMINAL: Array<'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'ERROR'> =
        ['APPROVED', 'DISAPPROVED', 'ABORTED', 'ERROR'];

    const selectProduct = (method: ProductKey) => {
        customResetTransaction();
        setTrxResult(null);
        setTrxStatus('PENDING');
        setPayment(0);
        setPaymentMethods(true);
        setAutoSubmitNonce((n) => n + 1);
        console.debug('[TransactionsPage] Produto selecionado:', method);
        setSelectedProduct(method);
    };

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

                                        setTrxResult(null);
                                        setTrxStatus('PENDING');
                                        setPayment(0);
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
                                const Icon = method === 'order' ? LinkIcon : method
                                === 'pinpad' ? Store : CreditCard;
                                return (
                                    <Button
                                        key={method}
                                        onClick={() => selectProduct(method)}
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


                    {selectedProduct === 'order' && (
                        <Order
                            key={`order-${autoSubmitNonce}`}
                            onConclude={resetSaleUI}
                            autoSubmitNonce={autoSubmitNonce}
                            onResultChange={setTrxResult}
                            onStatusChange={setTrxStatus}
                            onPaymentChange={setPayment}
                        />
                    )}
                    {selectedProduct === 'pinpad' && (
                        <Pinpad
                            key={`pinpad-${autoSubmitNonce}`}
                            autoSubmitNonce={autoSubmitNonce}
                            onConclude={resetSaleUI}
                            onResultChange={setTrxResult}
                            onStatusChange={setTrxStatus}
                            onPaymentChange={setPayment}
                        />
                    )}
                    {selectedProduct === 'pos' && (
                        <POS
                            key={`pos-${autoSubmitNonce}`}
                            onConclude={resetSaleUI}
                            autoSubmitNonce={autoSubmitNonce}
                            onResultChange={setTrxResult}
                            onStatusChange={setTrxStatus}
                            onPaymentChange={setPayment}
                        />
                    )}
                </Box>


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
                    <Box key={`${selectedProduct || 'none'}-${autoSubmitNonce}`} sx={{textAlign: 'center'}}>

                        {trxResult ? (
                            <>
                                {trxStatus === 'APPROVED' && (
                                    <SuccessResult
                                        customerName={trxResult.customerName || ''}
                                        customerDocument={trxResult.customerDocument || ''}
                                        amount={Number(trxResult.amount || 0)}
                                        installments={trxResult.installments || '1'}
                                        payment={payment}
                                        onConclude={resetSaleUI}
                                    />
                                )}

                                {trxStatus === 'DISAPPROVED' && <RejectedResult
                                    onConclude={resetSaleUI}
                                    onRetry={() => {
                                        setTrxResult(null);
                                        setTrxStatus('PENDING');
                                        setPayment(0);
                                        setAutoSubmitNonce(n => n + 1);
                                    }}
                                />}

                                {trxStatus === 'PROCESSING' && selectedProduct === 'pinpad' && (
                                    <PinpadResult onConclude={resetSaleUI}/>
                                )}

                                {trxStatus === 'PROCESSING' && selectedProduct === 'pos' && (
                                    <PosResult onConclude={resetSaleUI}/>
                                )}

                                {(trxStatus === 'PENDING') && (
                                    <OrderLinkResult payUrl={trxResult?.payUrl}/>
                                )}

                                {trxStatus === 'ABORTED' && <GenericErrorResult
                                    onConclude={resetSaleUI}
                                />}
                            </>
                        ) : (
                            selectedProduct ? <EmptyStateMessage product={selectedProduct as ProductKey}/> : null
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
