import { useEffect, useState } from 'react';
import axios from 'axios';
import PinpadResult from './PinpadResult';
import PinpadSuccessResult from './PinpadSuccessResult';
import OrderRejectedResult from './OrderRejectedResult';
import OrderGenericErrorResult from './OrderGenericErrorResult';

type Props = {
    transactionId: string;
};

export default function PinpadStatusPoller({ transactionId }: Props) {
    const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'ERROR'>('PENDING');
    const [pinpadData, setPinpadData] = useState<any>(null);

    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(`/api/proxy/pinpad/remote/status/${transactionId}`);
                const statusResult = data?.data?.status;

                console.log("📦 Status retornado:", statusResult);

                if (statusResult === 'APPROVED') {
                    setPinpadData({
                        customerName: data.data.clientName,
                        customerDocument: data.data.payments?.[0]?.recipientDocument ?? '',
                        amount: parseFloat(data.data.value),
                        installments: data.data.paymentQuantity,
                        payment: parseFloat(data.data.payments?.[0]?.value) || 0,
                    });
                    setStatus('APPROVED');
                    clearInterval(interval);
                    return;
                }

                if (statusResult === 'DISAPPROVED') {
                    setStatus('DISAPPROVED');
                    clearInterval(interval);
                    return;
                }

                if (statusResult === 'ABORTED') {
                    setStatus('ABORTED');
                    clearInterval(interval);
                    return;
                }

            } catch (error: any) {
                const message = error?.response?.data?.message;

                // Caso seja "Callback not found", apenas aguarda mais tempo
                if (message === 'Callback not found') {
                    console.warn('⌛ Aguardando callback ainda não processado...');
                } else {
                    console.error('❗ Erro ao consultar status da transação:', error);
                    setStatus('ERROR');
                    clearInterval(interval);
                    return;
                }
            }

            if (++attempts >= 36) {
                console.log("⏰ Timeout atingido após 3 minutos.");
                setStatus('ERROR');
                clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [transactionId]);

    console.log("Status atual do componente:", status);

    if (status === 'PENDING') return <PinpadResult transactionId={transactionId} />;
    if (status === 'APPROVED' && pinpadData) return <PinpadSuccessResult {...pinpadData} />;
    if (status === 'DISAPPROVED') return <OrderRejectedResult />;
    if (status === 'ABORTED' || status === 'ERROR') return <OrderGenericErrorResult />;

    return null;
}
