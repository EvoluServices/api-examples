import { Button, Typography, Box } from '@mui/material';

type OrderLinkResultProps = {
    payUrl?: string;
};

export default function OrderLinkResult({ payUrl }: OrderLinkResultProps) {
    return (
        <Box>
            <Typography variant="h5" sx={{ color: '#204986', fontWeight: 700 }} gutterBottom>
                Venda Criada com Sucesso
            </Typography>

            <Typography sx={{ color: '#5a646e', fontWeight: 700, mb: 2 }}>
                Para realizar o pagamento, disponibilize o link abaixo ao cliente:
            </Typography>

            {payUrl && (
                <Button
                    variant="contained"
                    href={payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        borderRadius: 4,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: '#0071EB',
                        minHeight: 50,
                    }}
                >
                    Acessar Link de Pagamento
                </Button>
            )}
        </Box>
    );
}
