import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { completeNewPasswordChallenge } from '@/services/cognito';
import { useTempUser } from '@/contexts/TempUserContext';
import { Box, TextField, Button, Typography, Alert, Collapse } from '@mui/material';

export default function NewPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { tempUser } = useTempUser();

    const handleSubmit = async () => {
        setError('');

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (!tempUser) {
            setError('Sessão inválida. Faça login novamente.');
            return;
        }

        try {
            const session = await completeNewPasswordChallenge(tempUser, newPassword);

            if (session?.getIdToken()) {
                await router.push('/transactions');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar senha. Tente novamente.');
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 400,
                    bgcolor: 'white',
                    p: 4,
                    borderRadius: 2,
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Typography variant="h6" fontWeight="bold" textAlign="center">
                    Defina sua nova senha
                </Typography>

                {Boolean(error) && (
                    <Collapse in sx={{ mb: 2, width: '100%' }}>
                        <Alert severity="error" aria-live="polite">
                            {error}
                        </Alert>
                    </Collapse>
                )}

                <TextField
                    label="Nova senha"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <TextField
                    label="Confirme a nova senha"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

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
                    onClick={handleSubmit}
                >
                    Confirmar nova senha
                </Button>
            </Box>
        </Box>
    );
}

NewPasswordPage.getLayout = (page: any) => <>{page}</>;