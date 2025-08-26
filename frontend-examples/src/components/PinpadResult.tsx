// components/PinpadResult.tsx
import {Box, Button, Typography} from '@mui/material';

type PinpadResultProp = {
    transactionId: string;
    onConclude?: () => void;
}

export default function PinpadResult({transactionId, onConclude}: PinpadResultProp) {
    return (
        <Box>
            <Typography variant="h5" sx={{color: '#204986', fontWeight: 700}}>
                Venda Criada com Sucesso
            </Typography>

            <Typography
                variant="body2"
                sx={{color: '#5a646e', lineHeight: '24px', fontWeight: 700, mb: 2}}
                gutterBottom
            >
                Aguarde o processamento da transação
            </Typography>

            <Box
                sx={{display: "flex", alignItems: "center", justifyContent: "center"}}
            >
                <Button
                    variant="contained"
                    color="primary"
                    sx={{
                        backgroundColor: '#0071EB',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '16px',
                        textTransform: 'none',
                        borderRadius: '16px',
                        py: '10px',
                        '&:hover': {backgroundColor: '#0071EB'},
                    }}
                    onClick={onConclude}
                >
                    Fechar
                </Button>
            </Box>
        </Box>
    );
}
