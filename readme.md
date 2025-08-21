# Frontend Examples — EvoluServices

Aplicação Next.js de exemplo para criação de vendas e integração com a API da EvoluServices.
O app permite selecionar o ambiente (Desenvolvimento ou Produção), configurar credenciais e realizar vendas nas modalidades Link, Pinpad e POS.

### Requisitos

* Node.js 18+ (recomendado 18 LTS ou 20 LTS)
* npm 9+


### Instalação e Execução

## 1) Clonar o repositório (ou baixar o zip)
```
git clone git@github.com:EvoluServices/api-chatbot.git
```

## 2) Entrar na pasta do frontend
```
cd frontend-examples
```

## 3) Instalar dependências
```
npm install
```

## 4) Rodar em modo desenvolvimento
```
npm run dev
```


A aplicação sobe por padrão em http://localhost:3000.



## Autenticação e Configuração

Antes de usar, o usuário precisa se autenticar com as credenciais fornecidas pela EvoluServices e selecionar o ambiente:

### Acesse a página Configurações.

Escolha o Ambiente de Desenvolvimento ou Ambiente de Produção.

Preencha:

### Chaves da API:

* Identificador (API `username`)

* Senha (API `password`)

### Chaves do Estabelecimento:

Nome do Estabelecimento (opcional)

Chave de Integração do Estabelecimento (`merchantCode`/`merchantPartnerKey`)

Clique em Salvar.

As credenciais são usadas para autenticação `Basic auth` nas chamadas à API de Order.
E `Bearer token` em Pinpad e POS

O aplicativo armazena a configuração localmente (cookie de configuração) para facilitar os próximos acessos.

### Nova Venda — Fluxo de Uso

Informe o valor e clique em Calcular.

Escolha a forma de pagamento:

* Link (pagamento via link)

* Pinpad

* POS

Selecione a Bandeira (ex.: Visa, Mastercard) e o Parcelamento.

Preencha os dados do cliente:

* Nome

* Documento: (CPF/CNPJ) — o app formata automaticamente CPF (11 dígitos) em `000.000.000-00` e CNPJ (14 dígitos) em `00.000.000/0000-00`

* Telefone:

* Email:

Clique em Finalizar.

### Resultado da Venda

Após finalizar, a aplicação exibe uma das telas abaixo:

#### Aprovada
Mostra o resumo com Valor, Recebimento (soma das parcelas retornadas) e Parcelamento.

#### Reprovadaf
Exibe orientação para revisar os dados/usar outro método de pagamento.

#### Pendente / Abortada
Exibe mensagem de “Venda criada com sucesso” e o link de pagamento (quando aplicável).
O app realiza polling do status a cada 30s, por até 5 minutos.

####  Erro Genérico
Exibe mensagem de erro e a orientação “Entre em contato com o suporte”.

Observação: quando a API retornar o objeto do pedido, o app soma todos os valores de pagamentos (todas as parcelas) e apresenta o Recebimento.

# Dicas de Troubleshooting

Credenciais inválidas: verifique o identificador/senha e a Chave de Integração do estabelecimento.

Ambiente incorreto: certifique-se de que selecionou Desenvolvimento ou Produção conforme seu acesso.

Porta ocupada: caso a porta 3000 esteja em uso, exporte PORT=3001 antes do npm run dev ou encerre o processo na 3000.

CORS/Firewall: se sua rede corporativa tiver inspeção SSL/Proxy, pode ser necessário configurar certificados/proxy local.

Erro de rede/LFS ao clonar: tente `git clone --depth 1 --filter=blob:none <repo>`.

## Licença

Uso interno/público