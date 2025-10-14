import {useEffect, useState} from "react";
import {Box, Grid, Typography, Button, IconButton, Snackbar, Alert, TextField, Radio, Collapse} from "@mui/material";
import {Stack} from "@mui/system";
import CodeIcon from "@mui/icons-material/Code";
import FactoryIcon from "@mui/icons-material/Factory";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { userPool } from '@/services/cognito';
import type { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';

export default function Index() {

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity]
        = useState<'success' | 'warning'>('warning');

    const [partnerDevKeyOpen, setPartnerDevKeyOpen]
        = useState(false);
    const PartnerDevKeyToggleOpen = () => setPartnerDevKeyOpen((prev) => !prev);

    const [partnerProdKeyOpen, setPartnerProdKeyOpen]
        = useState(false);
    const PartnerProdKeyToggleOpen = () => setPartnerProdKeyOpen((prev) => !prev);

    const [merchantDevKeyOpen, setMerchantDevKeyOpen]
        = useState(false);
    const merchantDevKeyToggleOpen = () => setMerchantDevKeyOpen((prev) => !prev);

    const [merchantProdKeyOpen, setMerchantProdKeyOpen]
        = useState(false);
    const MerchantProdKeyToggleOpen = () => setMerchantProdKeyOpen((prev) => !prev);

    const [selectedEnvironment, setSelectedEnvironment]
        = useState<'dev' | 'prod' | null>(null);

    const [devValues, setDevValues] = useState({
        apiKey: '',
        apiSecret: '',
        merchantName: '',
        merchantKey: '',
        callback: '',
    });

    const [prodValues, setProdValues] = useState({
        apiKey: '',
        apiSecret: '',
        merchantName: '',
        merchantKey: '',
        callback: '',
    });

    const [devErrors, setDevErrors] = useState({
        apiKey: false,
        apiSecret: false,
        merchantName: false,
        merchantKey: false,
        callback: false,
    });

    const [prodErrors, setProdErrors] = useState({
        apiKey: false,
        apiSecret: false,
        merchantName: false,
        merchantKey: false,
        callback: false,
    });

    function getCurrentCognitoUser(): CognitoUser | null {
      return userPool.getCurrentUser();
    }

    function updateCustomAttributes(
      user: CognitoUser,
      attrs: Record<string, string>
    ) {
      const list = Object.entries(attrs).map(
        ([k, v]) => new (require('amazon-cognito-identity-js').CognitoUserAttribute)({ Name: `custom:${k}`, Value: v })
      );

      return new Promise<string>((resolve, reject) => {
        user.getSession((err: any) => {
          if (err) return reject(err);
          user.updateAttributes(list as unknown as CognitoUserAttribute[], (e, result) => {
            if (e) return reject(e);
            resolve(result as string);
          });
        });
      });
    }

    function refreshTokens(user: CognitoUser): Promise<{
      idToken: string;
      accessToken: string;
      refreshToken: string;
    }> {
      return new Promise((resolve, reject) => {
        user.getSession((err: any, session: { getRefreshToken: () => any; }) => {
          if (err || !session) return reject(err || new Error('No session'));
          const refreshToken = session.getRefreshToken();
          user.refreshSession(refreshToken, (e, newSession) => {
            if (e) return reject(e);
            resolve({
              idToken: newSession.getIdToken().getJwtToken(),
              accessToken: newSession.getAccessToken().getJwtToken(),
              refreshToken: newSession.getRefreshToken().getToken(),
            });
          });
        });
      });
    }

    async function onSaveToCognito({
      env,
      values,
    }: {
      env: 'dev' | 'prod';
      values: { apiKey: string; apiSecret: string; merchantName?: string; merchantKey?: string };
    }) {
      const user = getCurrentCognitoUser();
      if (!user) throw new Error('Usuário não autenticado');

      const attrs: Record<string, string> = {
        'selected-env': env,
        [`${env}-username`]: values.apiKey,
        [`${env}-password`]: values.apiSecret,
        [`${env}-merchantName`]: values.merchantName ?? '',
        [`${env}-keyId`]: values.merchantKey ?? '',
      };

      await updateCustomAttributes(user, attrs);

      const tokens = await refreshTokens(user);

      await fetch('/api/session/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: tokens.idToken }),
      });

      // Busca dados não sensíveis da sessão para refletir na UI
      const me = await fetch('/api/session/me').then(r => r.json()).catch(() => null);
      if (me?.ok) {
        fillStateFromSession(me);
      }
    }

    function fillStateFromSession(me: {
        env?: 'dev' | 'prod';
        merchantKey?: string | null;
        merchantName?: string | null;
        apiKey?: string | null;
        apiSecret?: string | null;
    }) {
        const envClaim = (me.env as 'dev' | 'prod' | undefined) ?? 'dev';

        const toValues = (env: 'dev' | 'prod') => ({
            apiKey: env === envClaim ? (me.apiKey ?? '') : '',
            apiSecret: env === envClaim ? (me.apiSecret ?? '') : '',
            merchantName: env === envClaim ? (me.merchantName ?? '') : '',
            merchantKey: env === envClaim ? (me.merchantKey ?? '') : '',
            callback: '',
        });

        setDevValues(toValues('dev'));
        setProdValues(toValues('prod'));
        setSelectedEnvironment(envClaim);
    }

    useEffect(() => {
      (async () => {
        try {
          const me = await fetch('/api/session/me').then(r => r.json());
          if (me?.ok) {
            fillStateFromSession(me);
          }
        } catch (e) {
          console.warn('Falha ao carregar sessão', e);
        }
      })();
    }, []);

    const handleInputChange = (
        env: 'dev' | 'prod',
        field: keyof typeof devValues,
        value: string
    ) => {
        if (env === 'dev') {
            setDevValues((prev) => ({...prev, [field]: value}));
        } else {
            setProdValues((prev) => ({...prev, [field]: value}));
        }
    };

    const handleSave = async () => {
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
            callback: false,
        };

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(Boolean);

        if (hasError) {
            setSnackbarMessage("Preencha todos os campos obrigatórios.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            return;
        }

        try {
            await onSaveToCognito({ env: selectedEnvironment, values });
            setSnackbarMessage("Configurações salvas e sincronizadas no Cognito.");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (e: any) {
            console.error('Falha ao sincronizar com o Cognito', e);
            setSnackbarMessage(e?.message || "Falhou ao sincronizar no Cognito.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
        }
        console.log("Configuração salva (Cognito):", { env: selectedEnvironment, values });
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "1000px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 5,
            }}
        >
            <Box sx={{width: "100%", display: "flex", flexDirection: "column"}}>
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
                        pt: 2,
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
                            <Grid size={{xs: 12, md: 6}}>
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
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between"
                                           width="100%">
                                        <Stack direction="row" alignItems="center" gap={1} flexGrow={1}>
                                            <CodeIcon sx={{fontSize: 32, color: "#0774e7"}}/>
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
                                    <Box display="flex" alignItems="center" onClick={PartnerDevKeyToggleOpen}
                                         sx={{cursor: 'pointer'}}>
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
                                        <IconButton size="small" sx={{ml: 1}}>
                                            {partnerDevKeyOpen ? <ExpandLessIcon sx={{color: '#0d4c94'}}/> :
                                                <ExpandMoreIcon sx={{color: '#0d4c94'}}/>}
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
                                            A chave da API é um identificador único acompanhado de uma senha, utilizados
                                            pelos parceiros para se autenticar com segurança nos serviços da
                                            EvoluServices.
                                        </Typography>

                                    </Collapse>

                                    <Box display="flex" gap={2} flexDirection={{xs: 'column', sm: 'row'}}>
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
                                    <Box display="flex" alignItems="center" onClick={merchantDevKeyToggleOpen}
                                         sx={{cursor: 'pointer'}}>
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
                                        <IconButton size="small" sx={{ml: 1}}>
                                            {merchantDevKeyOpen ? <ExpandLessIcon sx={{color: '#0d4c94'}}/> :
                                                <ExpandMoreIcon sx={{color: '#0d4c94'}}/>}
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
                                            A chave do estabelecimento é um identificador único que representa a ligação
                                            entre o parceiro e o estabelecimento. Ela garante que, ao utilizar nossa
                                            API, a requisição seja direcionada corretamente para o estabelecimento
                                            vinculado, assegurando autenticidade e rastreabilidade da integração.
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

                            <Grid size={{xs: 12, md: 6}}>
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
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between"
                                           width="100%">
                                        <Stack direction="row" alignItems="center" gap={1} flexGrow={1}>
                                            <FactoryIcon sx={{fontSize: 32, color: "#0774e7"}}/>
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
                                    <Box display="flex" alignItems="center" onClick={PartnerProdKeyToggleOpen}
                                         sx={{cursor: 'pointer'}}>
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
                                        <IconButton size="small" sx={{ml: 1}}>
                                            {partnerProdKeyOpen ? <ExpandLessIcon sx={{color: '#0d4c94'}}/> :
                                                <ExpandMoreIcon sx={{color: '#0d4c94'}}/>}
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
                                            A chave de API em produção é fornecida pela EvoluServices após a conclusão
                                            do processo de homologação, conforme o método estabelecido para a integração
                                            em ambiente produtivo.
                                        </Typography>
                                    </Collapse>
                                    <Box display="flex" gap={2} flexDirection={{xs: 'column', sm: 'row'}}>
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
                                    <Box display="flex" alignItems="center" onClick={MerchantProdKeyToggleOpen}
                                         sx={{cursor: 'pointer'}}>
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
                                        <IconButton size="small" sx={{ml: 1}}>
                                            {partnerProdKeyOpen ? <ExpandLessIcon sx={{color: '#0d4c94'}}/> :
                                                <ExpandMoreIcon sx={{color: '#0d4c94'}}/>}
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
                                            A chave de API do estabelecimento em produção é fornecida pela EvoluServices
                                            após a conclusão do processo de homologação. O cadastro e a disponibilização
                                            dessas chaves são definidos em comum acordo entre o parceiro e a
                                            EvoluServices.
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
                                    backgroundColor: '#0071EB',
                                    color: '#FFF',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    textTransform: 'none',
                                    borderRadius: '16px',
                                    py: '10px',
                                    '&:hover': {backgroundColor: '#0071EB'},
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
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
                sx={{mt: '80px'}}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{width: '100%'}}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Box>
    );
}
