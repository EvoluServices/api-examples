import {Box, Typography, Paper, Button} from '@mui/material';
import Grid from '@mui/material/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {formatDocument} from '@/utils/formatDocument';
import {formatCurrency} from '@/utils/formatCurrency';

type SuccessResultProps = {
    customerName: string;
    customerDocument: string;
    amount: number;
    installments: string;
    payment: number;
    onConclude?: () => void;
};

export default function SuccessResult(
    {customerName, customerDocument, amount, installments, payment, onConclude,}: SuccessResultProps) {
    return (
        <Box
            sx={{
                ml: 2,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 0,
                px: 2,
            }}
        >
            <Box sx={{maxWidth: 900, width: '100%'}}>
                <Paper
                    elevation={2}
                    sx={{

                        bgcolor: '#0DA67B',
                        backgroundImage: 'none',
                        color: '#FFF',
                        p: {xs: 3, md: 5},
                        borderRadius: 3,
                    }}
                >
                    <Grid container spacing={4} alignItems="center">
                        {/* COLUNA ESQUERDA */}
                        <Grid size={{xs: 12, md: 5}}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: {xs: 2, md: 0}}}>
                                <CheckCircleIcon sx={{fontSize: 48}}/>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.2,
                                        textTransform: 'none',
                                    }}
                                >
                                    Transação aprovada
                                    <br/>
                                    com sucesso
                                </Typography>
                            </Box>
                        </Grid>

                        {/* COLUNA DIREITA */}
                        <Grid size={{xs: 12, md: 7}}>
                            <Grid container spacing={3}>
                                {/* Nome / Documento */}
                                <Grid size={6}>
                                    <Typography sx={{fontSize: 14, fontWeight: 700, opacity: 0.9}}>Nome:</Typography>
                                    <Typography sx={{fontSize: 16, fontWeight: 800, textTransform: 'capitalize'}}>
                                        {customerName}
                                    </Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography
                                        sx={{fontSize: 14, fontWeight: 700, opacity: 0.9}}>Documento:</Typography>
                                    <Typography sx={{fontSize: 16, fontWeight: 800}}>
                                        {formatDocument(customerDocument)}
                                    </Typography>
                                </Grid>

                                {/* Valor / Recebimento */}
                                <Grid size={6}>
                                    <Typography sx={{fontSize: 14, fontWeight: 700, opacity: 0.9}}>Valor:</Typography>
                                    <Typography sx={{fontSize: 16, fontWeight: 800}}>
                                        {amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                    </Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography
                                        sx={{fontSize: 14, fontWeight: 700, opacity: 0.9}}>Recebimento:</Typography>
                                    <Typography
                                        sx={{fontSize: 16, fontWeight: 800}}>{formatCurrency(payment)}</Typography>
                                </Grid>

                                {/* Parcelamento + Botão */}
                                <Grid size={6}>
                                    <Typography
                                        sx={{fontSize: 14, fontWeight: 700, opacity: 0.9}}>Parcelamento:</Typography>
                                    <Typography sx={{fontSize: 16, fontWeight: 800}}>{installments}x</Typography>
                                </Grid>

                                <Grid
                                    size={6}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: {xs: 'flex-start', md: 'flex-end'},
                                        alignItems: 'flex-end',
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        onClick={onConclude}
                                        sx={{
                                            borderRadius: '16px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            bgcolor: '#0071EB',
                                            color: '#FFF',
                                            minWidth: 160,
                                            py: 1.5,
                                            px: 4,
                                            boxShadow: 'none',
                                            '&:hover': {bgcolor: '#0a63c7'},
                                        }}
                                    >
                                        Concluir
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
}
