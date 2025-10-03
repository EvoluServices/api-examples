// components/NewPasswordModal.tsx
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
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { confirmForgotPassword } from '@/services/cognito';

interface NewPasswordModalProps {
    open: boolean;
    onClose: () => void;
    email: string; // email do usuário que recebeu o código
}

export default function NewPasswordModal({ open, onClose, email }: NewPasswordModalProps) {
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!code || !newPassword || !confirmPassword) {
            setError('Preencha todos os campos.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        setLoading(true);
        try {
            await confirmForgotPassword(email, code, newPassword);
            setSuccess('Senha alterada com sucesso!');
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err: any) {
            setError(err?.message || 'Erro ao alterar a senha.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
                <Typography>Digite o código enviado por e-mail e sua nova senha:</Typography>

                <TextField
                    label="Código"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    fullWidth
                />

                <TextField
                    label="Nova senha"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    label="Confirmar nova senha"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
            </DialogContent>

            <DialogActions>
                <Box display="flex" justifyContent="space-between" gap={2} width="100%" px={2} pb={2}>
                    <Button onClick={handleClose} disabled={loading}>
                        Fechar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        endIcon={loading ? <CircularProgress size={18} /> : null}
                    >
                        Enviar
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
