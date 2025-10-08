// components/ResetPassword.tsx
import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Typography,
} from '@mui/material';
import { forgotPassword } from '@/services/cognito';
import type { PaperProps } from '@mui/material/Paper';
import NewPasswordModal from './NewPasswordModal';

interface ResetPasswordProps {
    open: boolean;
    onClose: () => void;
}

export default function ResetPassword({ open, onClose }: ResetPasswordProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Estado para abrir o modal de inserir código + nova senha
    const [openNewPassword, setOpenNewPassword] = useState(false);

    const handleSend = async () => {
        setMessage(null);

        if (!email) {
            setMessage({ type: 'error', text: 'Informe um e-mail válido.' });
            return;
        }

        try {
            setLoading(true);
            await forgotPassword(email); // função do Cognito
            setMessage({
                type: 'success',
                text: 'Se o e-mail estiver cadastrado, você receberá instruções para resetar a senha.'
            });

            // abre modal de código + nova senha
            setOpenNewPassword(true);
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || 'Erro ao solicitar reset de senha.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setMessage(null);
        onClose();
    };

    return (
        <>
            {/* Modal principal de reset de senha */}
            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { borderRadius: '20px', p: 2 },
                } as Partial<PaperProps>}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        color: '#0071EB',
                    }}
                >
                    Redefinir senha
                </DialogTitle>

                <DialogContent>
                    <Typography sx={{ mb: 2, textAlign: 'center' }}>
                        Digite o e-mail cadastrado para receber as instruções:
                    </Typography>

                    <TextField
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        autoFocus
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                        }}
                    />

                    {message && (
                        <Alert severity={message.type} sx={{ mt: 2, borderRadius: '10px' }}>
                            {message.text}
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions>
                    <Box display="flex" justifyContent="space-between" gap={2} mt={2} width="100%" px={2}>
                        <Button
                            onClick={handleClose}
                            disabled={loading}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
                        >
                            Fechar
                        </Button>

                        <Button
                            onClick={handleSend}
                            disabled={loading}
                            variant="contained"
                            color="primary"
                            endIcon={loading ? <CircularProgress size={18} /> : null}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
                        >
                            Enviar
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Modal de inserir código e nova senha */}
            <NewPasswordModal
                open={openNewPassword}
                onClose={() => setOpenNewPassword(false)}
                email={email}
            />
        </>
    );
}
