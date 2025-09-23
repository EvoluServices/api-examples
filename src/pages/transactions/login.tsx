// pages/transaction/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, TextField, Button, Typography, Grid, Alert } from '@mui/material';
import Image from 'next/image';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Função simples de validação de email
    const isEmailValid = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleLogin = () => {
        setError('');

        if (!isEmailValid(email)) {
            setError('Email inválido');
            return;
        }

        if (password.length < 4) {
            setError('Senha muito curta');
            return;
        }

        // Aqui você chamaria sua API de login
        console.log('Login efetuado:', { email, password });

        // Redirecionar para a página principal (exemplo: /transactions)
        router.push('/transactions');
    };

    const isButtonDisabled = !email || !password || !isEmailValid(email);

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ minHeight: '100vh' }}
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
                <Image
                    src="/evoluservices.png"
                    alt="Logo"
                    width={210}
                    height={120}
                    style={{ marginBottom: 16 }}
                />

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
                />

                <TextField
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    fullWidth
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    sx={{ mt: 2 }}
                    disabled={isButtonDisabled}
                    fullWidth
                >
                    Entrar
                </Button>
            </Box>
        </Grid>
    );
}
