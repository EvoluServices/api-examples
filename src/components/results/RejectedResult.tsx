// components/results/RejectedResult.tsx
import { Box, Typography, Paper, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import CancelIcon from '@mui/icons-material/Cancel';

type RejectedResultProps = {
    onConclude?: () => void;
    onRetry?: () => void;
    title?: string;
    helperText?: React.ReactNode;
};

export default function RejectedResult({
                                           onConclude,
                                           onRetry,
                                           title = 'Transação reprovada',
                                           helperText = (
                                               <>
                                                   Oriente o cliente a revisar os dados de pagamento ou escolher outra forma de pagamento.
                                                   <br />
                                               </>
                                           ),
                                       }: RejectedResultProps) {
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
            <Box sx={{ maxWidth: 900, width: '100%' }}>
                <Paper
                    elevation={2}
                    sx={{
                        bgcolor: '#D32F2F',
                        backgroundImage: 'none',
                        color: '#FFF',
                        p: { xs: 3, md: 5 },
                        borderRadius: 3,
                    }}
                >
                    <Grid container spacing={4} alignItems="center">
                        {/* COLUNA ESQUERDA (título) */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, md: 0 } }}>
                                <CancelIcon sx={{ fontSize: 48 }} />
                                <Typography
                                    variant="h4"
                                    sx={{ fontWeight: 800, lineHeight: 1.2, textTransform: 'none' }}
                                >
                                    {title}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* COLUNA DIREITA (texto auxiliar) */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ display: 'grid', gap: 2 }}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: 'rgba(255,255,255,0.95)',
                                    }}
                                >
                                    Não foi possível concluir a transação:
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.9)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {helperText}
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                        mt: 1,
                                    }}
                                >
                                    {onRetry && (
                                        <Button
                                            variant="outlined"
                                            onClick={onRetry}
                                            sx={{
                                                borderRadius: '16px',
                                                textTransform: 'uppercase',
                                                fontWeight: 'bold',
                                                color: '#FFF',
                                                borderColor: 'rgba(255,255,255,0.7)',
                                                px: 3,
                                                py: 1.2,
                                                '&:hover': { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.08)' },
                                            }}
                                        >
                                            Tentar novamente
                                        </Button>
                                    )}

                                    <Button
                                        variant="contained"
                                        onClick={onConclude}
                                        sx={{
                                            borderRadius: '16px',
                                            textTransform: 'uppercase',
                                            fontWeight: 'bold',
                                            bgcolor: '#0a63c7',
                                            color: '#FFF',
                                            minWidth: 160,
                                            py: 1.5,
                                            px: 4,
                                            boxShadow: 'none',
                                            '&:hover': { bgcolor: '#0071EB' },
                                        }}
                                    >
                                        Concluir
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
}
