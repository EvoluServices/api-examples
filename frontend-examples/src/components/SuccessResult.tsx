import {Box, Typography, Paper, Grid, Button} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type SuccessResultProps = {
    customerName: string;
    amount: number;
    installments: string;
};

export default function SuccessResult({ customerName, amount, installments }: SuccessResultProps) {
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
                    <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 0 }} />
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

                        {/* Linha 1 - Nome e Documento */}
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e'}}>
                                Nome:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}>
                                {customerName}
                            </Typography>
                        </Grid>
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e'}}>
                                Documento:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}>
                                01234567890
                            </Typography>
                        </Grid>

                        {/* Linha 2 - Valor e Recebimento */}
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e'}}>
                                Valor:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}>
                                {amount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                })}
                            </Typography>
                        </Grid>
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e'}}>
                                Recebimento:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}>
                                R$ 90,00
                            </Typography>
                        </Grid>

                        {/* Linha 3 - Parcelamento e Botão */}
                        <Grid size={6}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5a646e'}}>
                                Parcelamento:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: '700', color: '#204986', textTransform: 'capitalize' }}>
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
