

/** CPF (11 dígitos) ou CNPJ (14 dígitos) */
export const regexDocument = /^(\d{11}|\d{14})$/;

/** Telefone com DDD + 9 dígitos (total 11 dígitos) */
export const regexPhone = /^\d{11}$/;

/** E-mail básico */
export const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Apenas números */
export const regexOnlyNumbers = /^\d+$/;

