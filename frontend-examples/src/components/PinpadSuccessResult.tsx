import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formatDocument } from '@/utils/formatDocument';
import { formatCurrency } from '@/utils/formatCurrency';
import { useRouter } from 'next/navigation';

type Props = {
    customerName: string;
    customerDocument: string;
    amount: number;
    installments: string;
    payment: number;
    onConclude?: () => void;
};

export default function PinpadSuccessResult({
    customerName,
    customerDocument,
    amount,
    installments,
    payment,
    onConclude,
}: Props) {
    const router = useRouter();

    const handleConclude = () => {
        if (onConclude) {
            onConclude(); // executa algo se o pai quiser tratar também
        }
        router.push('/'); // volta para a tela inicial
    };

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 0,
                px: 2,
            }}
        >
            <Box
                sx={{
                    maxWidth: 500,
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <Box>
                    <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
                </Box>
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="success.main"
                    sx={{ textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}
                >
                    Transação Aprovada com Sucesso
                </Typography>

                <Paper elevation={2} sx={{ p: 4, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
                    <Grid container spacing={4}>
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e' }}>
                                Nome:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}
                            >
                                {customerName}
                            </Typography>
                        </Grid>
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e' }}>
                                Documento:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}
                            >
                                {formatDocument(customerDocument)}
                            </Typography>
                        </Grid>
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e' }}>
                                Valor:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}
                            >
                                {amount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                })}
                            </Typography>
                        </Grid>
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e' }}>
                                Recebimento:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: '700', color: '#00af6c', textTransform: 'capitalize' }}
                            >
                                {formatCurrency(payment)}
                            </Typography>
                        </Grid>

                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e' }}>
                                Parcelamento:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}
                            >
                                {installments}x
                            </Typography>
                        </Grid>

                        <Grid
                            size={6}
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'flex-end',
                            }}
                        >
                            <Button
                                variant="outlined"
                                sx={{
                                    borderRadius: '16px',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    bgcolor: '#0071EB',
                                    color: '#FFF',
                                    minWidth: '120px',
                                    boxShadow: 'none',
                                    border: '1px solid #ccc',
                                    px: 4,
                                    py: 1.5,
                                }}
                                onClick={handleConclude}
                            >
                                Concluir
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
}
