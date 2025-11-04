import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton,
    Switch,
    Typography,
    Button,
    Grid,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import PaidIcon from '@mui/icons-material/Paid';

type SplitItem = { code: string; value: string; chargeFees: boolean };
type Supplier = { code: string; name: string };

type Props = {
    visible: boolean;
    value: SplitItem[];
    onChange: (v: SplitItem[]) => void;
    saleAmount: number;
    onValidityChange?: (ok: boolean) => void;
    feeRate?: number; // 💰 taxa dinâmica vinda do Pinpad
};

// Helpers de formatação
function toDotDecimal(input: string): string {
    const digits = (input || '').replace(/\D/g, '');
    if (!digits) return '0.00';
    const asInt = parseInt(digits, 10);
    return (asInt / 100).toFixed(2);
}

function toCommaDisplay(dotValue: string): string {
    if (!dotValue) return '';
    const n = Number(dotValue.replace(',', '.'));
    if (!Number.isFinite(n)) return '0,00';
    return n.toFixed(2).replace('.', ',');
}

async function fetchBearerToken(): Promise<string | null> {
    try {
        const res = await axios.post('/api/proxy/pinpad/remote/token', {});
        console.log('🔑 Token recebido:', res.data);
        return res.data?.Bearer || null;
    } catch (err: any) {
        console.error('❌ Erro ao obter token remoto:', err?.response?.data || err.message);
        return null;
    }
}

export default function Beneficiaries({
                                          visible,
                                          value,
                                          onChange,
                                          saleAmount,
                                          onValidityChange,
                                          feeRate = 0,
                                      }: Props) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);

    const fmtMoney = (n: number) =>
        n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // ===== Busca de fornecedores =====
    useEffect(() => {
        if (!visible) return;
        let isActive = true;
        const controller = new AbortController();

        const run = async () => {
            try {
                setLoading(true);
                let token = await fetchBearerToken();
                if (!token || !isActive) return;

                const meResp = await axios.get('/api/session/me', {
                    signal: controller.signal,
                });
                const merchantKey: string | undefined = meResp?.data?.merchantKey;
                if (!merchantKey || !isActive) return;

                const url = `/api/proxy/pinpad/remote/merchants/${merchantKey}/recipients`;
                const doFetch = async (bearer: string) => {
                    return axios.get(url, {
                        headers: { Authorization: `Bearer ${bearer}` },
                        params: { t: Date.now() },
                        signal: controller.signal,
                    });
                };

                let res;
                try {
                    res = await doFetch(token);
                } catch (err: any) {
                    if (err?.response?.status === 401 && isActive) {
                        const newToken = await fetchBearerToken();
                        if (newToken) res = await doFetch(newToken);
                        else throw err;
                    } else throw err;
                }

                if (!isActive) return;

                const mapped: Supplier[] = Array.isArray(res?.data)
                    ? res!.data.map((r: any) => ({ code: r.code, name: r.name }))
                    : [];
                setSuppliers(mapped);
            } catch (e) {
                if (!axios.isCancel(e)) {
                    console.error('❌ Erro ao buscar fornecedores:', e);
                    setSuppliers([]);
                }
            } finally {
                if (isActive) setLoading(false);
            }
        };

        run();
        return () => {
            isActive = false;
            controller.abort();
        };
    }, [visible]);

    if (!visible) return null;

    // Atualiza split
    const updateIndex =
        (index: number) =>
            (patch: Partial<SplitItem>) => {
                const next = [...value];
                next[index] = { ...next[index], ...patch };
                onChange(next);
            };

    // ===== Validação =====
    const totalSplit = value.reduce(
        (acc, s) => acc + (parseFloat(s.value || '0') || 0),
        0
    );

    const saleTotal = Number.isFinite(saleAmount) ? saleAmount : 0;
    const netAvailable = saleTotal > 0 ? saleTotal * (1 - (feeRate || 0)) : 0;
    const exceeds = totalSplit > netAvailable + 1e-6;

    useEffect(() => {
        if (!visible) return;
        const isValid = !exceeds;
        onValidityChange?.(isValid);

        if (!isValid) {
            console.warn(
                `⚠️ Valor de repasse acima do limite: ${fmtMoney(totalSplit)} 
                > ${fmtMoney(netAvailable)} (taxa ${(feeRate * 100).toFixed(2)}%)`
            );
        }
        // Dependências estáveis: apenas variáveis necessárias
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, exceeds, feeRate]);

    // 💬 Log para debug
    useEffect(() => {
        if (visible && feeRate > 0) {
            console.log(`💰 Taxa aplicada no Beneficiaries: ${(feeRate * 100).toFixed(2)}%`);
        }
    }, [feeRate, visible]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {value.map((split, index) => (
                <Box
                    key={index}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        p: 2,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        backgroundColor: '#fff',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {/* Fornecedor + Valor */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            select
                            size="small"
                            label="Fornecedor"
                            value={split.code}
                            onChange={(e) => updateIndex(index)({ code: e.target.value as string })}
                            sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '& fieldset': {
                                        borderColor: '#0071EB',
                                        borderWidth: '1.5px',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#005bb5',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#004799',
                                        borderWidth: '2px',
                                    },
                                },
                            }}
                        >
                            {suppliers.map((f) => (
                                <MenuItem key={f.code} value={f.code}>
                                    {f.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            size="small"
                            label="Valor (R$)"
                            type="text"
                            value={toCommaDisplay(split.value)}
                            placeholder="0,00"
                            onChange={(e) => {
                                const dot = toDotDecimal(e.target.value);
                                updateIndex(index)({ value: dot });
                            }}
                            onBlur={() => {
                                const dot = toDotDecimal(split.value);
                                updateIndex(index)({ value: dot });
                            }}
                            error={exceeds}
                            sx={{ flex: 1, borderRadius: 2 }}
                        />
                    </Box>

                    {/* ⚠️ Mensagem de aviso */}
                    {exceeds && (
                        <Typography sx={{ color: 'error.main', fontSize: 13, mt: -1 }}>
                            O total dos repasses não pode exceder o valor líquido após taxa de{' '}
                            {(feeRate * 100).toFixed(2)}%.
                            <br />
                            Valor máximo permitido: {fmtMoney(netAvailable)}.
                        </Typography>
                    )}

                    {/* Dividir taxa + ações */}
                    <Grid
                        container
                        spacing={2}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ mt: 0.5 }}
                    >
                        {/* Toggle "Dividir taxa" */}
                        <Grid size={{ xs:12, md:6}}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    border: '1px solid #ccc',
                                    borderRadius: 3,
                                    px: 1.5,
                                    py: 1,
                                    height: 40,
                                }}
                            >
                                <PaidIcon sx={{ color: '#3D5C3F' }} />
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    {split.chargeFees ? 'Sim Divide Taxa' : 'Não Divide Taxa'}
                                </Typography>
                                <Switch
                                    checked={!!split.chargeFees}
                                    onChange={(e) =>
                                        updateIndex(index)({ chargeFees: e.target.checked })
                                    }
                                    inputProps={{ 'aria-label': 'Dividir taxa' }}
                                />
                            </Box>
                        </Grid>

                        {/* Botão Incluir */}
                        <Grid size={{ xs:6, md:3}}>
                            {index === value.length - 1 ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={() => {
                                        const updated = [
                                            ...value,
                                            { code: '', value: '', chargeFees: false },
                                        ];
                                        onChange(updated);
                                    }}
                                    sx={{
                                        backgroundColor: '#0071EB',
                                        color: '#fff',
                                        textTransform: 'none',
                                        borderRadius: 999,
                                        px: 2.5,
                                        py: 0.75,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': { backgroundColor: '#005bb5' },
                                    }}
                                >
                                    Adicionar
                                </Button>
                            ) : (
                                // placeholder para manter alinhamento nas linhas intermediárias
                                <Box sx={{ height: 40 }} />
                            )}
                        </Grid>

                        {/* Botão Deletar */}
                        <Grid size={{ xs:6, md:3}}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<DeleteIcon />}
                                onClick={() => onChange(value.filter((_, i) => i !== index))}
                                sx={{
                                    backgroundColor: '#E57373',
                                    color: '#fff',
                                    textTransform: 'none',
                                    borderRadius: 999,
                                    px: 2.5,
                                    py: 0.75,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    '&:hover': { backgroundColor: '#d05c5c' },
                                }}
                            >
                                Deletar
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            ))}
        </Box>
    );
}
