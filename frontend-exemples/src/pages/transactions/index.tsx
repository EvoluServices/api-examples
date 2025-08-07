'use client';
import { useState, useEffect } from 'react';
import { Box, Button, TextField } from '@mui/material';
import LinkPagamento from '@/components/Order';
import Pinpad from '@/components/Pinpad';
import POS from '@/components/Pos';

export default function TransactionsPage() {
  const [valor, setValor] = useState('');
  const [erroValor, setErroValor] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [mostrarMetodos, setMostrarMetodos] = useState(false);
  const [metodoSelecionado, setMetodoSelecionado] = useState<string | null>(null);

  const [tipoPagamento, setTipoPagamento] = useState<string | null>(null);
  const [bandeiraSelecionada, setBandeiraSelecionada] = useState<string | null>(null);
  const [parcelas, setParcelas] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [documentoCliente, setDocumentoCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  const limparDadosCliente = () => {
    setNomeCliente('');
    setDocumentoCliente('');
    setTelefoneCliente('');
    setEmailCliente('');
  };

  const handleLimparTudo = () => {
    setValor('');
    setMostrarMetodos(false);
    setMetodoSelecionado(null);
    setTipoPagamento(null);
    setBandeiraSelecionada(null);
    setParcelas('');
    limparDadosCliente();
  };

  const formatarValor = (valorNumerico: string) => {
    if (!valorNumerico) return '';
    const centavos = parseInt(valorNumerico, 10);
    const valorFloat = centavos / 100;

    return valorFloat.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const valorEmReais = (parseInt(valor || '0', 10) / 100).toFixed(2);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const entrada = e.target.value;
    const somenteDigitos = entrada.replace(/\D/g, '');

    if (somenteDigitos.length <= 11) {
      setValor(somenteDigitos);
      setErroValor(false);
      setMensagemErro('');
    } else {
      setErroValor(true);
      setMensagemErro('Número muito grande');
    }
  };

  const handleCalcular = () => {
    if (valor.trim() !== '' && !erroValor) {
      setMostrarMetodos(true);
    }
  };

  // Se valor for apagado, volta tudo ao início
  useEffect(() => {
    if (valor === '') {
      handleLimparTudo();
    }
  }, [valor]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 4,
        paddingX: 3,
      }}
    >
      <Box
        sx={{
          borderRadius: 2,
          padding: 3,
          maxWidth: 1000,
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Campo valor + botão calcular */}
        <Box
          sx={{
            padding: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <TextField
            placeholder="Valor do tratamento"
            value={valor ? formatarValor(valor) : ''}
            onChange={handleValorChange}
            error={erroValor}
            helperText={erroValor ? mensagemErro : ''}
            variant="outlined"
            size="small"
            sx={{
              width: '200px',
              backgroundColor: '#fff',
              borderRadius: '30px',
              '& .MuiOutlinedInput-root': {
                height: '40px',
                borderRadius: '30px',
                paddingX: 2,
              },
              '& input': {
                paddingY: 0,
              },
            }}
            InputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
          />

          <Button
            variant="contained"
            disableElevation
            sx={{
              width: '200px',
              height: '40px',
              backgroundColor: '#004e93',
              color: 'white',
              borderRadius: '30px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#0056a6',
              },
            }}
            onClick={handleCalcular}
            disabled={erroValor || valor.trim() === ''}
          >
            Calcular
          </Button>
        </Box>

        {/* Métodos de pagamento */}
        {mostrarMetodos && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {['link', 'pinpad', 'pos'].map((metodo) => {
              const isActive = metodoSelecionado === metodo;
              return (
                <Button
                  key={metodo}
                  variant="contained"
                  disableElevation
                  sx={{
                    width: '190px',
                    height: '40px',
                    backgroundColor: isActive ? '#004e93' : '#0056a6',
                    color: 'white',
                    borderRadius: '30px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    borderBottom: isActive ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: isActive ? 'inset 0 -3px 0 #fff' : undefined,
                    '&:hover': {
                      backgroundColor: '#0056a6',
                    },
                  }}
                  onClick={() => {
                    setMetodoSelecionado(metodo);
                    setTipoPagamento(null);
                    setBandeiraSelecionada(null);
                    setParcelas('');
                    limparDadosCliente();
                  }}
                >
                  {metodo === 'link'
                    ? 'Link de Pagamento'
                    : metodo === 'pinpad'
                    ? 'Pinpad'
                    : 'POS'}
                </Button>
              );
            })}
          </Box>
        )}

        {/* Componentes filhos */}
        {metodoSelecionado === 'link' && (
          <LinkPagamento
            valor={valorEmReais}
            bandeiraSelecionada={bandeiraSelecionada}
            setBandeiraSelecionada={setBandeiraSelecionada}
            parcelas={parcelas}
            setParcelas={setParcelas}
            nomeCliente={nomeCliente}
            setNomeCliente={setNomeCliente}
            documentoCliente={documentoCliente}
            setDocumentoCliente={setDocumentoCliente}
            telefoneCliente={telefoneCliente}
            setTelefoneCliente={setTelefoneCliente}
            emailCliente={emailCliente}
            setEmailCliente={setEmailCliente}
            limparDadosCliente={limparDadosCliente}
          />
        )}

        {metodoSelecionado === 'pinpad' && (
          <Pinpad
            tipoPagamento={tipoPagamento}
            setTipoPagamento={setTipoPagamento}
            bandeiraSelecionada={bandeiraSelecionada}
            setBandeiraSelecionada={setBandeiraSelecionada}
            parcelas={parcelas}
            setParcelas={setParcelas}
            nomeCliente={nomeCliente}
            setNomeCliente={setNomeCliente}
            documentoCliente={documentoCliente}
            setDocumentoCliente={setDocumentoCliente}
            telefoneCliente={telefoneCliente}
            setTelefoneCliente={setTelefoneCliente}
            emailCliente={emailCliente}
            setEmailCliente={setEmailCliente}
            limparDadosCliente={limparDadosCliente}
            valor={valorEmReais}
          />
        )}

        {metodoSelecionado === 'pos' && (
          <POS
            tipoPagamento={tipoPagamento}
            setTipoPagamento={setTipoPagamento}
            bandeiraSelecionada={bandeiraSelecionada}
            setBandeiraSelecionada={setBandeiraSelecionada}
            parcelas={parcelas}
            setParcelas={setParcelas}
            nomeCliente={nomeCliente}
            setNomeCliente={setNomeCliente}
            documentoCliente={documentoCliente}
            setDocumentoCliente={setDocumentoCliente}
            telefoneCliente={telefoneCliente}
            setTelefoneCliente={setTelefoneCliente}
            emailCliente={emailCliente}
            setEmailCliente={setEmailCliente}
            limparDadosCliente={limparDadosCliente}
            valor={valorEmReais}
          />
        )}
      </Box>
    </Box>
  );
}
