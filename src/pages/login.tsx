import {useState, useCallback} from 'react';
import {useRouter} from 'next/router';
import Cookies from 'js-cookie';

// MUI Components
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
} from '@mui/material';
import {Visibility, VisibilityOff} from '@mui/icons-material';

// Custom Services & Contexts
import {signIn} from '@/services/cognito';
import {useTempUser} from '@/contexts/TempUserContext';
import ResetPassword from '@/components/ResetPassword';

// Interface opcional para segurança de tipos
interface SignInResult {
    challenge?: string;
    user?: any;
    idToken?: string;
    userAttributes?: { [key: string]: any };
}

// --- Componente de Login ---
export default function Login() {
    const router = useRouter();
    const {setTempUser} = useTempUser();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [openReset, setOpenReset] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Validação simples de email
    const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isButtonDisabled =
        !email || !password || !isEmailValid(email) || loading;

    const saveCustomAttributes = (userAttributes: { [key: string]: any }) => {
        const customAttrs = {
            keyId: userAttributes['custom:dev-keyId'],
            merchantName: userAttributes['custom:dev-merchantName'],
            selectedEnv: userAttributes['custom:selected-env'],
        };

        const cookieOptions = {
            expires: 1,
            secure: process.env.NODE_ENV === 'production',
        };

        if (customAttrs.merchantName) {
            Cookies.set('merchantName', customAttrs.merchantName, cookieOptions);
        }
        if (customAttrs.keyId) {
            Cookies.set('keyId', customAttrs.keyId, cookieOptions);
        }
    };

    const handleLogin = useCallback(async () => {
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
            const result: SignInResult = await signIn(email, password);

            // Fluxo 1: Nova Senha Obrigatória
            if (result?.challenge === 'NEW_PASSWORD_REQUIRED' && result?.user) {
                setTempUser(result.user);
                sessionStorage.setItem('cognitoUsername', email);
                await router.push('/new-password');
                return;
            }

            if (result.idToken != null) {
                Cookies.set('api-examples-token', result.idToken, {expires: 1});

                if (result?.userAttributes) {
                    saveCustomAttributes(result.userAttributes);
                }

                await router.push('/transactions');
            } else {
                setError('Erro ao autenticar. Tente novamente.');
            }

        } catch (err: any) {
            const msg =
                err?.message ||
                err?.code ||
                'Não foi possível autenticar. Verifique suas credenciais e tente novamente.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [email, password, router, setTempUser]);

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            sx={{minHeight: '100vh', bgcolor: 'background.default'}}
        >
            <Box display="flex" flexDirection="column" alignItems="center">
                {/* Box de Login */}
                <Box
                    p={4}
                    borderRadius="16px"
                    boxShadow={4}
                    display="flex"
                    flexDirection="column"
                    minWidth={320}
                    alignItems="center"
                    bgcolor="background.paper"
                >
                    <Typography
                        variant="h4"
                        sx={{color: '#0071EB', fontWeight: 700, mb: 2}}
                    >
                        LOGIN
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{mb: 2, width: '100%'}}>
                            {error}
                        </Alert>
                    )}

                    {/* Campo Email */}
                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        fullWidth
                        type="email"
                        autoComplete="username"
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />

                    {/* Campo Senha */}
                    <TextField
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        fullWidth
                        autoComplete="current-password"
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff/> : <Visibility/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Botão de Entrar */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLogin}
                        sx={{
                            mt: 2,
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.2,
                        }}
                        disabled={isButtonDisabled}
                        fullWidth
                        endIcon={loading ? <CircularProgress size={18} color="inherit"/> : undefined}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </Box>

                {/* Link Esqueci a senha */}
                <Button
                    variant="text"
                    onClick={() => setOpenReset(true)}
                    sx={{
                        mt: 1,
                        color: '#0071EB',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '18px',
                    }}
                >
                    Esqueci a senha
                </Button>
            </Box>

            {/* Modal ResetPassword */}
            <ResetPassword open={openReset} onClose={() => setOpenReset(false)}/>
        </Grid>
    );
}