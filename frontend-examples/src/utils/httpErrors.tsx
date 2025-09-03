// src/utils/httpErrors.ts
import { AxiosError } from "axios";

export type UiError = { title: string; description: string };

/** Mapa global de erros conhecidos retornados pela API */
const API_ERROR_MAP: Record<string, UiError> = {
    DOCUMENT_INVALID: {
        title: "Documento inválido",
        description:
            "O documento informado não foi aceito. Verifique se é um CPF/CNPJ válido.",
    },
    TOKEN_INVALID: {
        title: "Sessão expirada",
        description: "Não foi possível autenticar. Gere um novo token e tente novamente.",
    },

    NAME_CLIENT_INVALID: {
        title: "Nome do Cliente inválido",
        description: "O nome do cliente informado não foi aceito. Verifique se é um nome válido.",
    },

    PAYMENT_BRAND_ID_INVALID: {
        title: "Bandeira não permitida",
        description: "A bandeira de cartão informada não está habilitada para este ambiente.",
    },
    AMOUNT_INVALID: {
        title: "Valor inválido",
        description: "O valor informado está fora dos limites aceitos. Verifique e tente novamente.",
    },
    MERCHANT_NOT_FOUND: {
        title: "Estabelecimento não encontrado",
        description: "Verifique se o merchantId enviado é válido.",
    },
    UNKNOWN: {
        title: "Erro desconhecido",
        description: "Ocorreu um erro inesperado. Tente novamente.",
    },
};

/** Verifica se o body segue o formato { success: false, error: 'CODE' } e tenta mapear */
export function parseStandardErrorBody(body: any): UiError | undefined {
    if (!body) return;
    const failed =
        body?.success === false ||
        body?.success === "false" ||
        typeof body?.error === "string";
    if (!failed) return;

    const code = String(body?.error ?? body?.code ?? "UNKNOWN").toUpperCase();
    const mapped = API_ERROR_MAP[code];

    return mapped || {
        title: "Erro ao processar",
        description: `(${code}) Ocorreu um erro ao processar a solicitação.`,
    };
}

/** Parse genérico para erros de API (usado com axios, try/catch, etc.) */
export function parseApiError(err: unknown): UiError {
    const ax = err as AxiosError<any>;
    const status = ax?.response?.status;
    const body = ax?.response?.data;

    // Se tiver erro padrão no body (ex.: { error: 'DOCUMENT_INVALID' }), tenta mapear
    const mapped = parseStandardErrorBody(body);
    if (mapped) return mapped;

    const apiMsg =
        (body && (body.message || body.error)) ||
        (typeof ax?.message === "string" ? ax.message : "");

    if (status === 401) {
        return {
            title: "Não autenticado (401)",
            description:
                "Credenciais inválidas. Verifique seu Identificador, Senha e a Chave de Integração do Estabelecimento.",
        };
    }

    if (status === 403) {
        return {
            title: "Acesso negado (403)",
            description:
                "Você não tem permissão para executar esta operação neste ambiente.",
        };
    }

    if (status === 400 || status === 422) {
        return {
            title: "Requisição inválida",
            description: apiMsg || "Revise os dados enviados e tente novamente.",
        };
    }

    if (status && status >= 500) {
        return {
            title: `Erro interno (${status})`,
            description:
                "O servidor encontrou um erro inesperado. Tente novamente mais tarde.",
        };
    }

    if (!ax?.response) {
        return {
            title: "Sem conexão",
            description:
                "Não foi possível contatar o servidor. Verifique sua internet ou bloqueios de rede.",
        };
    }

    return {
        title: `Erro (${status ?? "desconhecido"})`,
        description: apiMsg || "Ocorreu um erro ao processar sua solicitação.",
    };
}
