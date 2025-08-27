import { useEffect, useState } from 'react';
import axios from 'axios';
import PosSuccessResult from './PosSuccessResult';
import PosRejectedResult from "@/components/PosRejectedResult";
import PosGenericErrorResult from "@/components/PosGenericErrorResult";
import PosResult from "@/components/PosResult";

type Props = {
    transactionId: string;
};

export default function PosStatusPoller({ transactionId }: Props) {
    const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'ERROR'>('PENDING');
    const [posData, setPosData] = useState<any>(null);

    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(`/api/proxy/pos/remote/status/${transactionId}`);
                const statusResult = data?.data?.status;

                console.log("Status retornado:", statusResult);

                const totalPayment = data.data.payments?.reduce((acc: number, curr: any) => {
                    return acc + parseFloat(curr.value);
                }, 0) || 0;

                if (statusResult === 'APPROVED') {
                    setPosData({
                        customerName: data.data.clientName,
                        customerDocument: data.data.payments?.[0]?.recipientDocument ?? '',
                        amount: parseFloat(data.data.value),
                        installments: data.data.paymentQuantity,
                        payment: totalPayment,
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

    if (status === 'PENDING') return <PosResult transactionId={transactionId} />;
    if (status === 'APPROVED' && posData) return <PosSuccessResult {...posData} />;
    if (status === 'DISAPPROVED') return <PosRejectedResult />;
    if (status === 'ABORTED' || status === 'ERROR') return <PosGenericErrorResult />;

    return null;
}
