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
    Snackbar,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { confirmForgotPassword, signIn } from '@/services/cognito';
import { PaperProps } from "@mui/material/Paper";
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

interface NewPasswordModalProps {
    open: boolean;
    onClose: () => void;
    email: string;
}

export default function NewPasswordModal({ open, onClose, email }: NewPasswordModalProps) {
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const router = useRouter();

    const handleSubmit = async () => {
        setError('');

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
            // Confirma a senha com o token
            await confirmForgotPassword(email, code, newPassword);

            // Loga automaticamente o usuário
            const result = await signIn(email, newPassword);
            if (result.idToken) {
                Cookies.set('api-examples-token', result.idToken, { expires: 1 });
            }

            // Mostra o Snackbar de sucesso e redireciona
            setSnackbarOpen(true);
            handleClose();

            setTimeout(() => {
                router.push('/transactions');
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
        setLoading(false);
        onClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        p: 2,
                        minWidth: 320,
                    },
                } as Partial<PaperProps>}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        color: '#0071EB',
                    }}
                >
                    Redefinir Senha
                </DialogTitle>

                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography>Digite o código enviado por e-mail e sua nova senha:</Typography>

                    <TextField
                        label="Código"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />

                    <TextField
                        label="Nova senha"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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

                    {error && <Alert severity="error" sx={{ borderRadius: '10px' }}>{error}</Alert>}
                </DialogContent>

                <DialogActions>
                    <Box display="flex" justifyContent="space-between" gap={2} width="100%" px={2} pb={2}>
                        <Button
                            onClick={handleClose}
                            disabled={loading}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                        >
                            Fechar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            endIcon={loading ? <CircularProgress size={18} /> : null}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                        >
                            Enviar
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Snackbar de sucesso */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={1500}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    Senha alterada com sucesso!
                </Alert>
            </Snackbar>
        </>
    );
}
