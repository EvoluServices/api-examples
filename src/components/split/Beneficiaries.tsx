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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaidIcon from '@mui/icons-material/Paid';

type SplitItem = { code: string; value: string; chargeFees: boolean };
type Supplier = { code: string; name: string };

type Props = {
  visible: boolean;
  value: SplitItem[];
  onChange: (v: SplitItem[]) => void;
  saleAmount: number;
  onValidityChange?: (ok: boolean) => void;
};

// Converte entrada livre para string decimal com PONTO, sempre duas casas (ex.: "1.00")
function toDotDecimal(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (!digits) return '0.00';
  const asInt = parseInt(digits, 10);
  return (asInt / 100).toFixed(2);
}

// Renderiza para a UI com VÍRGULA (ex.: "1,00")
function toCommaDisplay(dotValue: string): string {
  if (!dotValue) return '';
  const n = Number(dotValue.replace(',', '.'));
  if (!Number.isFinite(n)) return '0,00';
  return n.toFixed(2).replace('.', ',');
}

async function fetchBearerToken(): Promise<string | null> {
  try {
    const res = await axios.post('/api/proxy/pinpad/remote/token', {});
    return res.data?.Bearer || null;
  } catch {
    return null;
  }
}

export default function Beneficiaries({ visible, value, onChange, saleAmount, onValidityChange }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let isActive = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);

        // Always get a fresh token
        let token = await fetchBearerToken();
        if (!token || !isActive) return;

        const meResp = await axios.get('/api/session/me', { signal: controller.signal });
        const merchantKey: string | undefined = meResp?.data?.merchantKey;
        if (!merchantKey || !isActive) return;

        const url = `/api/proxy/pinpad/remote/merchants/${merchantKey}/recipients`;
        const doFetch = async (bearer: string) => {
          return axios.get(url, {
            headers: { bearer: bearer },
            params: { t: Date.now() },
            signal: controller.signal,
          });
        };

        let res;
        try {
          res = await doFetch(token);
        } catch (err: any) {
          // If the token was rejected (401), refresh once and retry
          if (err?.response?.status === 401 && isActive) {
            console.warn('🔁 Recipients 401 — refreshing token and retrying…');
            const newToken = await fetchBearerToken();
            if (newToken) {
              token = newToken;
              res = await doFetch(token);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }

        if (!isActive) return;

        const mapped: Supplier[] = Array.isArray(res?.data)
          ? res!.data.map((r: any) => ({ code: r.code, name: r.name }))
          : [];

        setSuppliers(mapped);
      } catch (e) {
        if (axios.isCancel(e)) {
          console.debug('⏹️ Recipients request cancelled');
        } else {
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

  const updateIndex =
    (index: number) =>
    (patch: Partial<SplitItem>) => {
      const next = [...value];
      next[index] = { ...next[index], ...patch };
      onChange(next);
    };

  // ===== Validação de soma dos splits vs valor da venda =====
  // Soma considerando que `value` está em dot-decimal ("1000.00")
  const totalSplit = value.reduce(
    (acc, s) => acc + (parseFloat(s.value || '0') || 0),
    0
  );
  const saleTotal = Number.isFinite(saleAmount) ? saleAmount : 0;
  const exceeds = totalSplit > saleTotal;

  // Notifica o componente pai (Pinpad) sobre validade dos splits
  useEffect(() => {
    if (!visible) return;
    onValidityChange?.(!exceeds);
  }, [visible, exceeds, onValidityChange]);

  // Formatação para exibição
  const fmtMoney = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    if (!visible) return;
    console.log('🔎 Splits atualizados (dot-decimal):', JSON.stringify(value, null, 2));
  }, [value, visible]);

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
          {/* ROW 1: Fornecedor (50%) + Valor (50%) */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Fornecedor */}
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id={`fornecedor-${index}`}>Fornecedor</InputLabel>
              <Select
                size={"small"}
                labelId={`fornecedor-${index}`}
                value={split.code}
                label="Fornecedor"
                onChange={(e) => updateIndex(index)({ code: e.target.value })}
                sx={{ borderRadius: 4 }}
              >
                {suppliers.map((f) => (
                  <MenuItem key={f.code} value={f.code}>
                    {f.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Valor */}
            <TextField
              size={"small"}
              label="Valor (R$)"
              type="text"
              value={toCommaDisplay(split.value)}
              placeholder="0,00"
              onChange={(e) => {
                const dot = toDotDecimal(e.target.value);
                updateIndex(index)({ value: dot });
                console.log(
                  '✏️ Split value edit -> index:',
                  index,
                  'raw(dot)=',
                  dot,
                  'display(comma)=',
                  toCommaDisplay(dot)
                );
              }}
              onBlur={() => {
                const dot = toDotDecimal(split.value);
                updateIndex(index)({ value: dot });
              }}
              error={exceeds}
              sx={{ flex: 1, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Dividir taxa */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: '1px solid #ccc',
                borderRadius: 4,
                px: 1.5,
                py: 1,
                height: 56
              }}
            >
              <PaidIcon sx={{ color: '#3D5C3F' }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {split.chargeFees ? 'Sim Divide Taxa' : 'Não Divide Taxa'}
              </Typography>
              <Switch
                checked={!!split.chargeFees}
                onChange={(e) => updateIndex(index)({ chargeFees: e.target.checked })}
                inputProps={{ 'aria-label': 'Dividir taxa' }}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: 'center',
                height: 56
              }}
            >
              {/* ➕ adicionar (apenas no último) */}
              {index === value.length - 1 && (
                <IconButton
                  onClick={() => {
                    const updated = [
                      ...value,
                      { code: '', value: '', chargeFees: false },
                    ];
                    onChange(updated);
                    console.log(
                      'Novo estado de splits (dot-decimal):',
                      JSON.stringify(updated, null, 2)
                    );
                  }}
                  aria-label="adicionar"
                  sx={{
                    backgroundColor: '#0071EB',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#005bb5' },
                  }}
                >
                  <AddCircleOutlineIcon />
                </IconButton>
              )}

              {/* 🗑️ remover */}
              <IconButton
                color="error"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label="remover"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      ))}
      {exceeds && (
        <Box sx={{ mt: 1, color: 'error.main', fontSize: 13 }}>
          Total dos splits ({fmtMoney(totalSplit)}) é maior que o valor da venda ({fmtMoney(saleTotal)}).
          Ajuste os valores para prosseguir.
        </Box>
      )}
    </Box>
  );
}
