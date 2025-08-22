// src/utils/document.ts

/** Mantém só dígitos */
export const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

/** CPF parcial/cheio: 000.000.000-00 (funciona enquanto digita) */
export function maskCpf(digits: string): string {
    const v = onlyDigits(digits).slice(0, 11);
    if (v.length <= 3) return v;
    if (v.length <= 6) return v.replace(/(\d{3})(\d+)/, '$1.$2');
    if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
}

/** CNPJ parcial/cheio: 00.000.000/0000-00 (funciona enquanto digita) */
export function maskCnpj(digits: string): string {
    const v = onlyDigits(digits).slice(0, 14);
    if (v.length <= 2) return v;
    if (v.length <= 5) return v.replace(/(\d{2})(\d+)/, '$1.$2');
    if (v.length <= 8) return v.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (v.length <= 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3\/$4');
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3\/$4-$5');
}

/** Máscara dinâmica: até 11 → CPF; 12–14 → CNPJ */
export function maskCpfCnpj(digits: string): string {
    const v = onlyDigits(digits).slice(0, 14);
    return v.length <= 11 ? maskCpf(v) : maskCnpj(v);
}

/** Validação básica por comprimento (11=CPF, 14=CNPJ) */
export function isCpfCnpjLenValid(digits: string): boolean {
    const len = onlyDigits(digits).length;
    return len === 11 || len === 14;
}
