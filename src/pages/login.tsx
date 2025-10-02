// src/pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Alert,
    CircularProgress,
    Link as MuiLink,
} from '@mui/material';
import Cookies from 'js-cookie';

import { signIn } from '@/services/cognito';
import { useTempUser } from '@/contexts/TempUserContext';
import ResetPassword from '@/components/ResetPassword'; // ajuste para o caminho correto do seu componente

export default function Login() {
    const router = useRouter();
    const { setTempUser } = useTempUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // estado para o modal "esqueci a senha"
    const [openReset, setOpenReset] = useState(false);

    const isEmailValid = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleLogin = async () => {
        setError('');
        if (!isEmailValid(email)) {
            setError('Email inválido');
            return;
        }
        if (!password || password.length < 4) {
            setError('Senha muito curta');
            return;
        }

        try {
            setLoading(true);
            const result = await signIn(email, password);

            if (result?.challenge === 'NEW_PASSWORD_REQUIRED' && result.user) {
                setTempUser(result.user);
                sessionStorage.setItem('cognitoUsername', email);
                await router.push('/new-password');
                return;
            }

            if (result.idToken != null) {
                Cookies.set('api-examples-token', result.idToken, { expires: 1 });
            }

            await router.push('/transactions');
        } catch (err: any) {
            const msg =
                err?.message ||
                err?.code ||
                'Não foi possível autenticar. Verifique suas credenciais e tente novamente.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const isButtonDisabled =
        !email || !password || !isEmailValid(email) || loading;

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ minHeight: '100vh' }}
        >
            {/* agrupando login + link em uma coluna */}
            <Box display="flex" flexDirection="column" alignItems="center">
                {/* Box de login */}
                <Box
                    p={4}
                    borderRadius={2}
                    boxShadow={3}
                    display="flex"
                    flexDirection="column"
                    minWidth={320}
                    alignItems="center"
                    bgcolor="background.paper"
                >
                    <Typography
                        variant="h4"
                        sx={{
                            color: '#0071EB',
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        LOGIN
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        fullWidth
                        type="email"
                        autoComplete="username"
                    />

                    <TextField
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        fullWidth
                        autoComplete="current-password"
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLogin}
                        sx={{ mt: 2 }}
                        disabled={isButtonDisabled}
                        fullWidth
                        endIcon={
                            loading ? <CircularProgress size={18} color="inherit" /> : undefined
                        }
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </Box>

                {/* Link Esqueci a senha logo abaixo do box */}
                <MuiLink
                    component="button"
                    type="button"
                    onClick={() => setOpenReset(true)}
                    sx={{ mt: 1, color: '#0071EB', fontWeight: 500 }}
                >
                    Esqueci a senha
                </MuiLink>
            </Box>

            {/* Modal ResetPassword */}
            <ResetPassword open={openReset} onClose={() => setOpenReset(false)} />
        </Grid>
    );
}
