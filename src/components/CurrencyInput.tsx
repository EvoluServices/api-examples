import { TextField } from '@mui/material';

type Props = {
    value: string;
    onChange: (formatted: string, raw: number) => void;
    error?: boolean;
};

export default function CurrencyInput({ value, onChange, error }: Props) {
    const formatCurrency = (raw: string): string => {
        const digits = raw.replace(/\D/g, '');
        const number = parseFloat(digits) / 100;


        if (isNaN(number)) return '';

        return number.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
        });
    };

    const parseCurrency = (valor: string): number => {
        if (!valor) return 0;

        const parsed = parseFloat(
            valor
                .replace(/\s/g, '')
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
        );

        return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '');

        if (digits.length === 0) {
            onChange('', 0); // valor vazio
            return;
        }

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
            variant="outlined"
            sx={{
                minWidth: '370px',
                backgroundColor: "#fff",
                borderRadius: 3,
                '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                }
            }}
        />
    );
}
