export function formatDocument(value: string): string {
    if (!value) return "";

    const onlyNumbers = value.replace(/\D/g, "");

    if (onlyNumbers.length === 11) {
        // CPF: 000.000.000-00
        return onlyNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    if (onlyNumbers.length === 14) {
        // CNPJ: 00.000.000/0000-00
        return onlyNumbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }

    // fallback (não reconhecido)
    return value;
}
