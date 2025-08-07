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
import { bandeiras } from './Brand'; // já contém imagem

interface Props {
  valor: string;
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
}

export default function LinkPagamento({
  valor,
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
}: Props) {
  const valorFloat = parseFloat(valor || '0');

  const mostrarBandeira = !!valor;
  const mostrarParcelas = mostrarBandeira && !!bandeiraSelecionada;
  const mostrarDadosCliente = mostrarParcelas && !!parcelas;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
      {/* Linha com bandeira e parcelas lado a lado */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Bandeira */}
        {mostrarBandeira && (
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
                {bandeiras.map((b) => (
                  <MenuItem key={b.value} value={b.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={b.imagem}
                        alt={b.label}
                        style={{ width: 24, height: 16, marginRight: 8 }}
                      />
                      {b.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Parcelas */}
        {mostrarParcelas && (
          <Box sx={{ width: '180px' }}>
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
      {mostrarDadosCliente && (
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
