// pages/login2.tsx
'use client';

import {useState} from 'react';
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
import {Visibility, VisibilityOff} from '@mui/icons-material';

export default function Login2() {


    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 2,
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
        '&:hover': {backgroundColor: '#005bb5'},
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
        '&:hover': {backgroundColor: '#f0f0f0'},
    };

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{minHeight: '100vh', flexDirection: 'column', gap: 16}}
        >
            <Box
                p={4}
                borderRadius={2}
                boxShadow={3}
                display="flex"
                flexDirection="column"
                minWidth={300}
                alignItems="center"
                sx={{backgroundColor: '#FFF'}}
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


                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    sx={{...inputStyle, my: 1}}
                />

                <TextField
                    label="Senha"
                    fullWidth

                />

                <Button
                    variant="contained"
                    sx={{mt: 2, width: '100%', ...mainButtonStyle}}
                >

                </Button>
            </Box>

            <Button
                variant="text"
                size="small"
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

            {/* Modal de recuperação de senha
            <Dialog
                >
                <DialogTitle>Esqueceu a senha?</DialogTitle>

                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300}}>
                    <Typography>Digite seu e-mail para receber um link de recuperação:</Typography>

                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        sx={{...inputStyle, my: 1}}
                    />
                </DialogContent>

                <DialogActions sx={{justifyContent: 'center', gap: 2, px: 3, pb: 2}}>
                    <Button

                        sx={secondaryButtonStyle} // branco
                    >
                        Fechar
                    </Button>

                    <Button
                        variant="contained"
                    >
                        Enviar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de sucesso */}
            {/*  <Dialog

            >
                <Alert
                    severity="success"
                    sx={{
                        borderRadius: 2,
                        maxWidth: 400,
                        mx: 'auto',
                    }}
                >
                    E-mail enviado com sucesso
                </Alert>
            </Dialog> */}
        </Grid>
    );
}
