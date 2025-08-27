// pages/api/proxy/pinpad/remote/status/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    try {
        const response = await axios.get(
            'https://dru6h7hnec.execute-api.us-east-2.amazonaws.com/default/callbacks',
            {
                params: { remoteTransactionId: id },
            }
        );
        res.status(200).json(response.data);
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("❌ Erro na chamada Axios:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                message: error.response?.data?.message || 'Erro desconhecido',
            });
        } else {
            console.error("❌ Erro inesperado:", error);
            res.status(500).json({ message: 'Erro interno inesperado' });
        }
    }
}
