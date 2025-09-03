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
            const msg = error.response?.data?.message || error.message;

            if (msg === 'Callback not found') {
                console.warn(`Aguardando callback do Pinpad ainda não processado para ID: ${id}`);
                res.status(204).end();
                return;
            }

            console.error(`❌ Erro na chamada Axios para o status do Pinpad [${id}]:`, msg);
            res.status(error.response?.status || 500).json({
                message: msg || 'Erro desconhecido',
            });

        } else {
            console.error("❌ Erro inesperado ao consultar status do Pinpad:", error);
            res.status(500).json({ message: 'Erro interno inesperado' });
        }
    }
}
