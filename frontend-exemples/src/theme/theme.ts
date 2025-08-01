// src/theme/theme.ts
import { createTheme } from "@mui/material";
import { palette } from './palette';

const theme = createTheme({
    typography: {
        fontFamily: "Inter, sans-serif",
    },
    palette,
});

export default theme;