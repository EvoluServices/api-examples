import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function PosGenericErrorResult() {
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
                    <ErrorOutlineIcon sx={{ fontSize: 56, color: '#ED6C02', mb: 0 }} />
                </Box>

                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: '#ED6C02', textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}
                >
                    Erro na Transação
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: '#5a646e',
                        lineHeight: "24px",
                        fontWeight: 700,
                        mb: 2
                    }}
                    gutterBottom
                >
                    Ocorreu um erro inesperado ao processar a transação.
                    Entre em contato com o suporte para mais informações.
                </Typography>

                <Button
                    variant="outlined"
                    sx={{
                        borderRadius: '16px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        bgcolor: '#ED6C02',
                        color: '#FFF',
                        minWidth: '120px',
                        boxShadow: 'none',
                        border: '1px solid #ccc',
                        px: 4,
                        py: 1.5,
                    }}
                >
                    Contatar Suporte
                </Button>

            </Box>
        </Box>
    );
}
