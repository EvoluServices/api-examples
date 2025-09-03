export type TxResult = {
    payUrl?: string;
    uuid: string;
    customerName?: string;
    customerDocument?: string;
    amount?: string;
    installments?: string;
} | null;
