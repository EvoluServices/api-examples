// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword((prev) => !prev);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const isEmailValid = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleLogin = async () => {
        setError('');
        if (!isEmailValid(email) || password.length < 4) {
            setError('Login/senha inválidos');
            return;
        }

        setLoading(true);
        try {
            // Simulação de login async (substitua pela API real)
            await new Promise((resolve) => setTimeout(resolve, 1500));

            router.push('/transactions');
        } catch (err) {
            setError('Erro ao efetuar login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const isButtonDisabled = !email || !password || !isEmailValid(email) || loading;

    const handleForgotSend = () => {
        if (!isEmailValid(forgotEmail)) {
            setError('Email inválido para recuperação');
            return;
        }
        setForgotSuccess('Link de recuperação enviado para seu email.');
        setError('');
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: '#FFF',
        },
    };
    const mainButtonStyle = {
        borderRadius: '16px',
        backgroundColor: '#0071EB',
        color: '#FFF',
        fontWeight: 700,
        fontSize: '16px',
        textTransform: 'none',
        py: '10px',
        '&:hover': { backgroundColor: '#005bb5' },
    };
    const secondaryButtonStyle = {
        borderRadius: '16px',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        backgroundColor: '#FFF',
        color: '#0071EB',
        minWidth: 120,
        boxShadow: 'none',
        border: '1px solid #ccc',
        '&:hover': { backgroundColor: '#f0f0f0' },
    };

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}
        >
            <Box
                p={4}
                borderRadius={2}
                boxShadow={3}
                display="flex"
                flexDirection="column"
                minWidth={300}
                alignItems="center"
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: '#0071EB',
                        fontWeight: 700,
                        mb: 2,
                    }}
                >
                    Login
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, width: '100%' }} role="alert">
                        {error}
                    </Alert>
                )}

                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    sx={{ ...inputStyle, my: 1 }}
                />

                <TextField
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    sx={{ ...inputStyle, my: 1 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="contained"
                    onClick={handleLogin}
                    sx={{ mt: 2, width: '100%', ...mainButtonStyle }}
                    disabled={isButtonDisabled}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                </Button>
            </Box>

            <Button
                variant="text"
                size="small"
                onClick={() => setForgotOpen(true)}
                sx={{
                    textTransform: 'none',
                    color: '#0071EB',
                    fontSize: '18px',
                    fontWeight: 600,
                    p: '8px 16px',
                }}
            >
                Esqueci a senha
            </Button>

            <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)}>
                <DialogTitle>Recuperar senha</DialogTitle>
                <DialogContent
                    sx={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 300 }}
                >
                    <Typography>
                        Esqueceu a senha? Digite seu e-mail para receber um link de
                        recuperação:
                    </Typography>

                    {error && <Alert severity="error">{error}</Alert>}
                    {forgotSuccess && <Alert severity="success">{forgotSuccess}</Alert>}

                    <TextField
                        label="Email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        fullWidth
                        sx={{ ...inputStyle, my: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setForgotOpen(false);
                            setForgotEmail('');
                            setError('');
                            setForgotSuccess('');
                        }}
                        sx={secondaryButtonStyle}
                    >
                        Fechar
                    </Button>
                    <Box sx={{ flexGrow: 1 }}>
                        <Button
                            variant="contained"
                            onClick={handleForgotSend}
                            sx={{ width: '100%', ...mainButtonStyle }}
                        >
                            Enviar
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}
