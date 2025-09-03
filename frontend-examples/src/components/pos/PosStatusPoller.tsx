import {useEffect} from 'react';
import axios from 'axios';

type Props = {
    transactionId: string;
    onStatusChange?: (s: 'PENDING' | 'APPROVED' | 'DISAPPROVED' | 'ABORTED' | 'PROCESSING' | 'ERROR') => void;
    onPaymentChange?: (v: number) => void;
    onApprovedData?: (data: {
        customerName: string;
        customerDocument: string;
        amount: number;
        installments: string;
    }) => void;
};

export default function PosStatusPoller({transactionId, onStatusChange, onPaymentChange, onApprovedData,}: Props) {
    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(async () => {
            try {
                const {data} = await axios.get(`/api/proxy/pinpad/remote/status/${transactionId}`);
                const st: string = data?.data?.status;

                const totalPayment =
                    data?.data?.payments?.reduce((acc: number, p: any) => acc + parseFloat(p.value), 0) ?? 0;

                if (st === 'APPROVED') {
                    onPaymentChange?.(totalPayment);
                    onApprovedData?.({
                        customerName: data.data.clientName,
                        customerDocument: data.data.payments?.[0]?.recipientDocument ?? '',
                        amount: parseFloat(data.data.value),
                        installments: String(data.data.paymentQuantity),
                    });
                    onStatusChange?.('APPROVED');
                    clearInterval(interval);
                    return;
                }

                if (st === 'DISAPPROVED') {
                    onStatusChange?.('DISAPPROVED');
                    clearInterval(interval);
                    return;
                }

                if (st === 'ABORTED') {
                    onStatusChange?.('ABORTED');
                    clearInterval(interval);
                    return;
                }

                onStatusChange?.('PROCESSING');
            } catch (err: any) {
                const msg = err?.response?.data?.message;
                if (msg !== 'Callback not found') {
                    onStatusChange?.('ERROR');
                    clearInterval(interval);
                    return;
                }
            }

            if (++attempts >= 36) { // ~3min em 5s
                onStatusChange?.('ERROR');
                clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [transactionId, onApprovedData, onPaymentChange, onStatusChange]);

    return null;
}
