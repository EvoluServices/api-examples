// src/utils/httpErrors.ts
import { AxiosError } from 'axios';

type UiError = { title: string; description: string };

export function parseApiError(err: unknown): UiError {
    const ax = err as AxiosError<any>;
    const status = ax?.response?.status;
    const apiMsg =
        (ax?.response?.data && (ax.response.data.message || ax.response.data.error)) ||
        (typeof ax?.message === 'string' ? ax.message : '');

    // Mapas mais comuns
    if (status === 401) {
        return {
            title: 'Não autenticado (401)',
            description:
                'Credenciais inválidas. Verifique seu Identificador,Senha \n e a Chave de Integração do Estabelecimento e tente novamente.',
        };
    }
    if (status === 403) {
        return {
            title: 'Acesso negado (403)',
            description:
                'Seu usuário não tem permissão para essa operação neste ambiente. Confirme as permissões e tente novamente.',
        };
    }
    if (status === 400 || status === 422) {
        return {
            title: 'Dados inválidos',
            description: apiMsg || 'Revise os campos enviados e tente novamente.',
        };
    }
    if (status && status >= 500) {
        return {
            title: `Erro no servidor (${status})`,
            description:
                'Ocorreu uma falha no processamento. Tente novamente em alguns instantes.',
        };
    }

    // Sem resposta (queda de rede, CORS, timeout) ou casos não mapeados
    if (!ax?.response) {
        return {
            title: 'Sem conexão',
            description:
                'Não foi possível contatar o servidor. Verifique sua internet ou bloqueios de rede (CORS/Proxy) e tente novamente.',
        };
    }

    // Fallback genérico
    return {
        title: `Erro (${status ?? 'desconhecido'})`,
        description: apiMsg || 'Ocorreu um erro ao processar sua solicitação.',
    };
}
