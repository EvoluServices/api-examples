import { TextField } from '@mui/material';

type Props = {
    value: string;
    onChange: (formatted: string, raw: number) => void;
    error?: boolean;
    helperText?: string;
};

export default function CurrencyInput({ value, onChange, error, helperText }: Props) {
    const formatCurrency = (raw: string): string => {
        const digits = raw.replace(/\D/g, '');
        const number = parseFloat(digits) / 100;
        return number.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        });
    };

    const parseCurrency = (valor: string): number => {
        return parseFloat(
            valor
                .replace(/\s/g, '')
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '');
        if (digits.length <= 11) {
            const formatted = formatCurrency(digits);
            const raw = parseCurrency(formatted);
            onChange(formatted, raw);
        }
    };

    return (
        <TextField
            placeholder="Valor do tratamento"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? helperText : ''}
            variant="outlined"
            sx={{
                minWidth: '330px',
                backgroundColor: "#fff",
                borderRadius: 3,
                '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                }
            }}
        />
    );
}
