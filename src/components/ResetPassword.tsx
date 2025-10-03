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
    Typography
} from '@mui/material';
import { forgotPassword } from '@/services/cognito';
import NewPasswordModal from './NewPasswordModal'; // novo modal para código e nova senha

interface ResetPasswordProps {
    open: boolean;
    onClose: () => void;
}

export default function ResetPassword({ open, onClose }: ResetPasswordProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // novo estado para controlar abertura do modal de nova senha
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

            // abre o modal de inserir código + nova senha
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
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Redefinir senha</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Digite o e-mail cadastrado para receber as instruções:
                    </Typography>
                    <TextField
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                    {message && (
                        <Alert severity={message.type} sx={{ mt: 2 }}>
                            {message.text}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Box display="flex" justifyContent="space-between" gap={2} mt={2}>
                        <Button onClick={handleClose} disabled={loading}>
                            Fechar
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={loading}
                            variant="contained"
                            color="primary"
                            endIcon={loading ? <CircularProgress size={18} /> : null}
                        >
                            Enviar
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* modal de código + nova senha */}
            <NewPasswordModal
                open={openNewPassword}
                onClose={() => setOpenNewPassword(false)}
                email={email} // passa o e-mail digitado
            />
        </>
    );
}
