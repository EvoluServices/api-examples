import {useEffect, useState} from "react";
import {Box, Grid, Typography, Button, IconButton,Snackbar, Alert, TextField, Radio, Collapse} from "@mui/material";
import { Stack } from "@mui/system";
import CodeIcon from "@mui/icons-material/Code";
import FactoryIcon from "@mui/icons-material/Factory";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Cookies from 'js-cookie';

export default function Index() {

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'warning'>('warning');

    const [partnerDevKeyOpen, setPartnerDevKeyOpen] = useState(false);
    const PartnerDevKeyToggleOpen = () => setPartnerDevKeyOpen((prev) => !prev);

    const [partnerProdKeyOpen, setPartnerProdKeyOpen] = useState(false);
    const PartnerProdKeyToggleOpen = () => setPartnerProdKeyOpen((prev) => !prev);

    const [merchantDevKeyOpen, setMerchantDevKeyOpen] = useState(false);
    const merchantDevKeyToggleOpen = () => setMerchantDevKeyOpen((prev) => !prev);

    const [merchantProdKeyOpen, setMerchantProdKeyOpen] = useState(false);
    const MerchantProdKeyToggleOpen = () => setMerchantProdKeyOpen((prev) => !prev);

    const [selectedEnvironment, setSelectedEnvironment] = useState<'dev' | 'prod' | null>(null);

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    const COOKIE_ENV_KEY = 'api-examples-selected-env';               // 'dev' | 'prod'
    const COOKIE_CFG_KEY = (env: 'dev' | 'prod') => `api-examples-config-${env}`;

    function readConfigFromCookie(env: 'dev' | 'prod') {
        const raw = Cookies.get(COOKIE_CFG_KEY(env));
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    function applyFromCookie(env: 'dev' | 'prod') {
        const cfg = readConfigFromCookie(env);
        if (!cfg) return;

        if (env === 'dev') {
            setDevValues(cfg.values);
        } else {
            setProdValues(cfg.values);
        }
    }

    useEffect(() => {
        const lastEnv = Cookies.get(COOKIE_ENV_KEY) as 'dev' | 'prod' | undefined;
        if (lastEnv) {
            setSelectedEnvironment(lastEnv);
            applyFromCookie(lastEnv);
        }
    }, []);


    const [devValues, setDevValues] = useState({
        apiKey: '',
        apiSecret: '',
        merchantName: '',
        merchantKey: '',
    });

    const [prodValues, setProdValues] = useState({
        apiKey: '',
        apiSecret: '',
        merchantName: '',
        merchantKey: '',
    });

    const [devErrors, setDevErrors] = useState({
        apiKey: false,
        apiSecret: false,
        merchantName: false,
        merchantKey: false,
    });

    const [prodErrors, setProdErrors] = useState({
        apiKey: false,
        apiSecret: false,
        merchantName: false,
        merchantKey: false,
    });

    const handleInputChange = (
        env: 'dev' | 'prod',
        field: keyof typeof devValues,
        value: string
    ) => {
        if (env === 'dev') {
            setDevValues((prev) => ({ ...prev, [field]: value }));
        } else {
            setProdValues((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = () => {
        if (!selectedEnvironment) {
            setSnackbarMessage("Selecione um ambiente antes de salvar.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            return;
        }

        const values = selectedEnvironment === 'dev' ? devValues : prodValues;
        const setErrors = selectedEnvironment === 'dev' ? setDevErrors : setProdErrors;

        const newErrors = {
            apiKey: values.apiKey.trim() === '',
            apiSecret: values.apiSecret.trim() === '',
            merchantName: values.merchantName.trim() === '',
            merchantKey: values.merchantKey.trim() === '',
        };

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(Boolean);

        if (hasError) {
            setSnackbarMessage("Preencha todos os campos obrigatórios.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            return;
        }

        const environmentUrl =
            selectedEnvironment === 'dev'
                ? 'https://sandbox.evoluservices.com'
                : 'https://api.evoluservices.com';

        const config = {
            url: environmentUrl,
            values, // { apiKey, apiSecret, merchantName, merchantKey }
        };

        Cookies.set(COOKIE_CFG_KEY(selectedEnvironment), JSON.stringify(config), {
            expires: 7,
            sameSite: 'Lax',
            secure: isHttps,
            path: '/',
        });

        Cookies.set(COOKIE_ENV_KEY, selectedEnvironment, {
            expires: 7,
            sameSite: 'Lax',
            secure: isHttps,
            path: '/',
        });

        applyFromCookie(selectedEnvironment);

        setSnackbarMessage("Configurações salvas com sucesso.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        console.log("Configuração salva:", config);
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "1000px",
                margin: "0 auto",
                padding: "0 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 5,
            }}
        >
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: "40px",
                        lineHeight: "56px",
                        color: "#204986",
                        mb: 1,
                    }}
                >
                    Configurações
                </Typography>

                <Typography
                    sx={{
                        fontWeight: 500,
                        fontSize: "20px",
                        lineHeight: "28px",
                        color: "#5a646e",
                    }}
                >
                    Primeiro, selecione seu ambiente!
                </Typography>

                <Box
                    sx={{
                        bgcolor: "#F2F4F8",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "20px",
                        gap: "20px",
                    }}
                >
                    <Box
                        component="form"
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            width: "100%",
                        }}
                    >
                        <Grid container spacing={6} alignItems="flex-start">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box
                                    sx={{
                                        bgcolor: "#fff",
                                        border: selectedEnvironment === 'dev' ? "2px solid #0774e7" : "2px solid #d1d5db",
                                        borderRadius: "16px",
                                        p: 2,
                                        position: "relative",
                                        width: "100%",
                                    }}
                                    onClick={() => {
                                        setSelectedEnvironment('dev');
                                        applyFromCookie('dev');
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                        <Stack direction="row" alignItems="center" gap={1} flexGrow={1}>
                                            <CodeIcon sx={{ fontSize: 32, color: "#0774e7" }} />
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "16px",
                                                    lineHeight: "24px",
                                                    color: "#5a646e",
                                                }}
                                            >
                                                Ambiente de Desenvolvimento
                                            </Typography>
                                        </Stack>
                                        <Radio
                                            checked={selectedEnvironment === 'dev'}
                                            value="dev"
                                            name="radio-buttons"
                                            sx={{
                                                color: "#0774e7",
                                            }}
                                        />
                                    </Stack>
                                </Box>

                                <Box mt={2}>
                                    <Box display="flex" alignItems="center" onClick={PartnerDevKeyToggleOpen} sx={{ cursor: 'pointer' }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "16px",
                                                lineHeight: "24px",
                                                color: "#204986",
                                            }}
                                        >
                                            Chaves da API
                                        </Typography>
                                        <IconButton size="small" sx={{ ml: 1 }}>
                                            {partnerDevKeyOpen ? <ExpandLessIcon sx={{ color: '#0d4c94' }} /> : <ExpandMoreIcon sx={{ color: '#0d4c94' }} />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={partnerDevKeyOpen} timeout="auto" unmountOnExit>

                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "14px",
                                                lineHeight: "20px",
                                                color: "#5a646e",
                                                mb: 2,
                                            }}
                                        >
                                            A chave da API é um identificador único acompanhado de uma senha, utilizados pelos parceiros para se autenticar com segurança nos serviços da EvoluServices.
                                        </Typography>

                                    </Collapse>

                                    <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                                        <TextField
                                            label="Identificador"
                                            variant="outlined"
                                            fullWidth
                                            value={devValues.apiKey}
                                            onChange={(e) => handleInputChange('dev', 'apiKey', e.target.value)}
                                            error={devErrors.apiKey}
                                            sx={{
                                                backgroundColor: "#fff",
                                                borderRadius: 3,
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3,
                                                }
                                            }}
                                        />
                                        <TextField
                                            label="Senha"
                                            variant="outlined"
                                            type="password"
                                            fullWidth
                                            value={devValues.apiSecret}
                                            onChange={(e) => handleInputChange('dev', 'apiSecret', e.target.value)}
                                            error={devErrors.apiSecret}
                                            sx={{
                                                backgroundColor: "#fff",
                                                borderRadius: 3,
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3,
                                                }
                                            }}
                                        />
                                    </Box>

                                </Box>
                                <Box mt={2}>
                                    <Box display="flex" alignItems="center" onClick={merchantDevKeyToggleOpen} sx={{ cursor: 'pointer' }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "16px",
                                                lineHeight: "24px",
                                                color: "#204986",
                                            }}
                                        >
                                            Chaves do Estabelecimento
                                        </Typography>
                                        <IconButton size="small" sx={{ ml: 1 }}>
                                            {merchantDevKeyOpen ? <ExpandLessIcon sx={{ color: '#0d4c94' }} /> : <ExpandMoreIcon sx={{ color: '#0d4c94' }} />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={merchantDevKeyOpen} timeout="auto" unmountOnExit>

                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "14px",
                                                lineHeight: "20px",
                                                color: "#5a646e",
                                                mb: 2,
                                            }}
                                        >
                                            A chave do estabelecimento é um identificador único que representa a ligação entre o parceiro e o estabelecimento. Ela garante que, ao utilizar nossa API, a requisição seja direcionada corretamente para o estabelecimento vinculado, assegurando autenticidade e rastreabilidade da integração.
                                        </Typography>

                                    </Collapse>

                                        <Box
                                            display="flex"
                                            flexDirection="column"
                                            rowGap={2}
                                        >
                                            <TextField
                                                label="Nome do Estabelecimento"
                                                variant="outlined"
                                                fullWidth
                                                value={devValues.merchantName}
                                                onChange={(e) => handleInputChange('dev', 'merchantName', e.target.value)}
                                                error={devErrors.merchantName}
                                                sx={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Chave de Integração do Estabelecimento"
                                                variant="outlined"
                                                type="password"
                                                fullWidth
                                                value={devValues.merchantKey}
                                                onChange={(e) => handleInputChange('dev', 'merchantKey', e.target.value)}
                                                error={devErrors.merchantKey}
                                                sx={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                        </Box>

                                </Box>

                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box
                                    sx={{
                                        bgcolor: "#fff",
                                        border: selectedEnvironment === 'prod' ? "2px solid #0774e7" : "2px solid #d1d5db",
                                        borderRadius: "16px",
                                        p: 2,
                                        position: "relative",
                                        width: "100%",
                                    }}
                                    onClick={() => {
                                        setSelectedEnvironment('prod');
                                        applyFromCookie('prod');
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                                        <Stack direction="row" alignItems="center" gap={1} flexGrow={1}>
                                            <FactoryIcon sx={{ fontSize: 32, color: "#0774e7" }} />
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: "16px",
                                                    lineHeight: "24px",
                                                    color: "#5a646e",
                                                }}
                                            >
                                                Ambiente de Produção
                                            </Typography>
                                        </Stack>
                                        <Radio
                                            checked={selectedEnvironment === 'prod'}
                                            value="prod"
                                            name="radio-buttons"
                                            sx={{
                                                color: "#0774e7",
                                            }}
                                        />
                                    </Stack>
                                </Box>

                                <Box mt={2}>
                                    <Box display="flex" alignItems="center" onClick={PartnerProdKeyToggleOpen} sx={{ cursor: 'pointer' }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "16px",
                                                lineHeight: "24px",
                                                color: "#204986",
                                            }}
                                        >
                                            Chaves da API
                                        </Typography>
                                        <IconButton size="small" sx={{ ml: 1 }}>
                                            {partnerProdKeyOpen ? <ExpandLessIcon sx={{ color: '#0d4c94' }} /> : <ExpandMoreIcon sx={{ color: '#0d4c94' }} />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={partnerProdKeyOpen} timeout="auto" unmountOnExit>

                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "14px",
                                                lineHeight: "20px",
                                                color: "#5a646e",
                                                mb: 2,
                                            }}
                                        >
                                            A chave de API em produção é fornecida pela EvoluServices após a conclusão do processo de homologação, conforme o método estabelecido para a integração em ambiente produtivo.
                                        </Typography>
                                    </Collapse>
                                        <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                                            <TextField
                                                label="Identificador"
                                                variant="outlined"
                                                fullWidth
                                                value={prodValues.apiKey}
                                                onChange={(e) => handleInputChange('prod', 'apiKey', e.target.value)}
                                                error={prodErrors.apiKey}
                                                sx={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Senha"
                                                variant="outlined"
                                                type="password"
                                                fullWidth
                                                value={prodValues.apiSecret}
                                                onChange={(e) => handleInputChange('prod', 'apiSecret', e.target.value)}
                                                error={prodErrors.apiSecret}
                                                sx={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                        </Box>

                                </Box>

                                <Box mt={2}>
                                    <Box display="flex" alignItems="center" onClick={MerchantProdKeyToggleOpen} sx={{ cursor: 'pointer' }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "16px",
                                                lineHeight: "24px",
                                                color: "#204986",
                                            }}
                                        >
                                            Chaves do Estabelecimento
                                        </Typography>
                                        <IconButton size="small" sx={{ ml: 1 }}>
                                            {partnerProdKeyOpen ? <ExpandLessIcon sx={{ color: '#0d4c94' }} /> : <ExpandMoreIcon sx={{ color: '#0d4c94' }} />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={merchantProdKeyOpen} timeout="auto" unmountOnExit>

                                        <Typography
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "14px",
                                                lineHeight: "20px",
                                                color: "#5a646e",
                                                mb: 2,
                                            }}
                                        >
                                            A chave de API do estabelecimento em produção é fornecida pela EvoluServices após a conclusão do processo de homologação. O cadastro e a disponibilização dessas chaves são definidos em comum acordo entre o parceiro e a EvoluServices.
                                        </Typography>
                                    </Collapse>
                                        <Box
                                            display="flex"
                                            flexDirection="column"
                                            rowGap={2}
                                        >
                                            <TextField
                                                label="Nome do Estabelecimento"
                                                variant="outlined"
                                                fullWidth
                                                value={prodValues.merchantName}
                                                onChange={(e) => handleInputChange('prod', 'merchantName', e.target.value)}
                                                error={prodErrors.merchantName}
                                                sx={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Chave de Integração do Estabelecimento"
                                                variant="outlined"
                                                type="password"
                                                fullWidth
                                                value={prodValues.merchantKey}
                                                onChange={(e) => handleInputChange('prod', 'merchantKey', e.target.value)}
                                                error={prodErrors.merchantKey}
                                                sx={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 3,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                    }
                                                }}
                                            />
                                        </Box>

                                </Box>
                            </Grid>
                        </Grid>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "40px",
                                width: "100%",
                                mt: 2,
                            }}
                        >
                            <Button
                                color="primary"
                                variant="contained"
                                onClick={handleSave}
                                sx={{
                                    borderRadius: '30px',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    backgroundColor: '#004e93',
                                    '&:hover': { backgroundColor: '#0056a6' },
                                }}
                            >
                                Salvar
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ mt: '80px' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Box>
    );
}
