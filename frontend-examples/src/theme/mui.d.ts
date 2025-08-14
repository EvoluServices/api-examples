import { PaletteColor, SimplePaletteColorOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface PaletteColor {
        extralight?: string;
    }

    interface SimplePaletteColorOptions {
        extralight?: string;
    }

    interface Palette {
        bg: {
            defaultPage: string;
        };
        black: {
            87: string;
            60: string;
            38: string;
            12: string;
            0o4: string;
        };
        white: {
            100: string;
            70: string;
            40: string;
            12: string;
        };
    }

    interface PaletteOptions {
        bg?: {
            defaultPage: string;
        };
        black?: {
            87: string;
            60: string;
            38: string;
            12: string;
            0o4: string;
        };
        white?: {
            100: string;
            70: string;
            40: string;
            12: string;
        };
    }
}
