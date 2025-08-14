'use client';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';

interface Props {
  tipoPagamento: string | null;
  setTipoPagamento: (value: string) => void;
  bandeiraSelecionada: string | null;
  setBandeiraSelecionada: (value: string) => void;
  parcelas: string;
  setParcelas: (value: string) => void;
  nomeCliente: string;
  setNomeCliente: (value: string) => void;
  documentoCliente: string;
  setDocumentoCliente: (value: string) => void;
  telefoneCliente: string;
  setTelefoneCliente: (value: string) => void;
  emailCliente: string;
  setEmailCliente: (value: string) => void;
  limparDadosCliente: () => void;
  valor: string;
}

const bandeirasDisponiveis = [
  { value: 'VISA_CREDITO', label: 'Visa' },
  { value: 'VISA_ELECTRON', label: 'Visa Electron' },
  { value: 'MASTERCARD', label: 'MasterCard' },
  { value: 'MAESTRO', label: 'MasterCard Maestro' },
  { value: 'AMEX', label: 'American Express' },
  { value: 'DINERS', label: 'Diners' },
  { value: 'HIPERCARD', label: 'Hipercard' },
  { value: 'AURA', label: 'Aura' },
  { value: 'SOROCRED', label: 'Sorocred' },
  { value: 'ELO', label: 'Elo' },
  { value: 'SICREDI', label: 'Sicred' },
  { value: 'ELO_DEBITO', label: 'Elo Débito' },
  { value: 'HIPER', label: 'Hiper' },
  { value: 'AGIPLAN', label: 'Agiplan' },
  { value: 'BANESCARD', label: 'Banescard' },
  { value: 'CREDZ', label: 'CredZ' },
  { value: 'JCB', label: 'JCB' },
  { value: 'CABAL', label: 'Cabal' },
  { value: 'MAIS', label: 'Mais' },
];

export default function POS({
  tipoPagamento,
  setTipoPagamento,
  bandeiraSelecionada,
  setBandeiraSelecionada,
  parcelas,
  setParcelas,
  nomeCliente,
  setNomeCliente,
  documentoCliente,
  setDocumentoCliente,
  telefoneCliente,
  setTelefoneCliente,
  emailCliente,
  setEmailCliente,
  limparDadosCliente,
  valor
}: Props) {
  const valorFloat = parseFloat(valor || '0');

  const mostrarParcelas = tipoPagamento === 'credito';
  const mostrarDadosCliente = tipoPagamento === 'debito' || parcelas;
  const mostrarFinalizar = mostrarDadosCliente;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      {/* Linha com os selects lado a lado */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Tipo de pagamento */}
        <Box sx={{ width: '150px' }}>
          <FormControl fullWidth size="small">
            <InputLabel id="tipo-pagamento-label">Tipo</InputLabel>
            <Select
              labelId="tipo-pagamento-label"
              id="select-tipo"
              value={tipoPagamento || ''}
              label="Tipo"
              onChange={(e) => {
                setTipoPagamento(e.target.value);
                setBandeiraSelecionada('');
                setParcelas('');
                limparDadosCliente();
              }}
            >
              <MenuItem value="debito">Débito</MenuItem>
              <MenuItem value="credito">Crédito</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Bandeira */}
        {tipoPagamento && (
          <Box sx={{ width: '200px' }}>
            <FormControl fullWidth size="small">
              <InputLabel id="bandeira-label">Bandeira</InputLabel>
              <Select
                labelId="bandeira-label"
                id="select-bandeira"
                value={bandeiraSelecionada || ''}
                label="Bandeira"
                onChange={(e) => setBandeiraSelecionada(e.target.value)}
              >
                {bandeirasDisponiveis.map((b) => (
                  <MenuItem key={b.value} value={b.value}>
                    {b.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Parcelas (só aparece se for crédito) */}
        {mostrarParcelas && (
          <Box sx={{ width: '200px' }}>
            <FormControl fullWidth size="small">
              <InputLabel id="parcelas-label">Parcelas</InputLabel>
              <Select
                labelId="parcelas-label"
                id="select-parcelas"
                value={parcelas}
                label="Parcelas"
                onChange={(e) => setParcelas(e.target.value)}
              >
                {[...Array(24)].map((_, i) => {
                  const numeroParcela = i + 1;
                  const valorParcela = valorFloat / numeroParcela;

                  return (
                    <MenuItem key={numeroParcela} value={String(numeroParcela)}>
                      {numeroParcela}x de{' '}
                      {valorParcela.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Dados do cliente */}
      {mostrarDadosCliente && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '600px',
            mt: 2,
          }}
        >
          <TextField
            label="Nome do Cliente"
            size="small"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
          />
          <TextField
            label="Documento"
            size="small"
            value={documentoCliente}
            onChange={(e) => setDocumentoCliente(e.target.value)}
          />
          <TextField
            label="Telefone"
            size="small"
            value={telefoneCliente}
            onChange={(e) => setTelefoneCliente(e.target.value)}
          />
          <TextField
            label="Email"
            size="small"
            value={emailCliente}
            onChange={(e) => setEmailCliente(e.target.value)}
          />
        </Box>
      )}

      {/* Botão Finalizar */}
      {mostrarFinalizar && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            sx={{
              borderRadius: '30px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              backgroundColor: '#004e93',
              '&:hover': { backgroundColor: '#0056a6' },
            }}
          >
            Finalizar
          </Button>
        </Box>
      )}
    </Box>
  );
}
