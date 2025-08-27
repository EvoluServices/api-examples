import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

export default function PosRejectedResult() {
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
                    <CancelIcon sx={{ fontSize: 56, color: '#D32F2F', mb: 0 }} />
                </Box>

                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: '#D32F2F', textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}
                >
                    Transação Reprovada
                </Typography>

                <Typography variant="body2"
                            sx={{
                                color: '#5a646e',
                                lineHeight: "24px",
                                fontWeight: 700,
                                mb: 2
                            }}
                            gutterBottom
                >
                    Não foi possível concluir a transação. Oriente o cliente a revisar os dados do pagamento ou escolher outra forma de pagamento.
                </Typography>

            </Box>
        </Box>
    );
}
