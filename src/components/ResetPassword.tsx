// components/ResetPassword.tsx
import { useState, useEffect } from 'react';
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
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { PaperProps } from '@mui/material/Paper';
import { forgotPassword, confirmForgotPassword } from '@/services/cognito';
import { useRouter } from 'next/router';

interface ResetPasswordProps {
    open: boolean;
    onClose: () => void;
}

export default function ResetPassword({ open, onClose }: ResetPasswordProps) {
    const [step, setStep] = useState<'email' | 'token' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const router = useRouter();

    // Fecha automaticamente 3 segundos após sucesso
    useEffect(() => {
        if (step === 'success') {
            const timeout = setTimeout(() => {
                handleClose();
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [step]);

    const handleSendEmail = async () => {
        setMessage(null);
        if (!email) {
            setMessage({ type: 'error', text: 'Informe um e-mail válido.' });
            return;
        }
        try {
            setLoading(true);
            await forgotPassword(email);
            setMessage({ type: 'success', text: 'Um código foi enviado para seu e-mail.' });
            setStep('token');
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || 'Erro ao enviar o e-mail de redefinição.' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmToken = async () => {
        setMessage(null);
        if (!token || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Preencha todos os campos.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }
        try {
            setLoading(true);
            await confirmForgotPassword(email, token, newPassword);
            setStep('success');
            setMessage({ type: 'success', text: 'Senha redefinida com sucesso!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || 'Código inválido ou erro ao redefinir senha.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setToken('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage(null);
        setStep('email');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{ sx: { borderRadius: '20px', p: 2 } } as Partial<PaperProps>}
        >
            <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', color: '#0071EB' }}>
                {step === 'email' && 'Redefinir senha'}
                {step === 'token' && 'Digite o código recebido'}
                {step === 'success' && 'Senha redefinida'}
            </DialogTitle>

            <DialogContent>
                {step === 'email' && (
                    <>
                        <Typography sx={{ mb: 2, textAlign: 'center' }}>
                            Digite o e-mail cadastrado para receber o código de redefinição:
                        </Typography>
                        <TextField
                            label="E-mail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            autoFocus
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                    </>
                )}

                {step === 'token' && (
                    <>
                        <TextField
                            label="Código"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            fullWidth
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                            label="Nova senha"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            fullWidth
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Confirmar nova senha"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </>
                )}

                {step === 'success' && (
                    <Box sx={{ textAlign: 'center', my: 2 }}>
                        <Typography sx={{ mb: 2 }}>

                        </Typography>
                    </Box>
                )}

                {message && (
                    <Alert severity={message.type} sx={{ mt: 2, borderRadius: '10px' }}>
                        {message.text}
                    </Alert>
                )}
            </DialogContent>

            {step !== 'success' && (
                <DialogActions>
                    <Box display="flex" justifyContent="space-between" gap={2} mt={2} width="100%" px={2}>
                        <Button
                            onClick={handleClose}
                            disabled={loading}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
                        >
                            Fechar
                        </Button>

                        {step === 'email' && (
                            <Button
                                onClick={handleSendEmail}
                                disabled={loading}
                                variant="contained"
                                color="primary"
                                endIcon={loading ? <CircularProgress size={18} /> : null}
                                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
                            >
                                Enviar
                            </Button>
                        )}

                        {step === 'token' && (
                            <Button
                                onClick={handleConfirmToken}
                                disabled={loading}
                                variant="contained"
                                color="primary"
                                endIcon={loading ? <CircularProgress size={18} /> : null}
                                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
                            >
                                Confirmar
                            </Button>
                        )}
                    </Box>
                </DialogActions>
            )}
        </Dialog>
    );
}
