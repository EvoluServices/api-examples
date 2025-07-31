// src/theme/theme.ts
import { createTheme } from "@mui/material";

const theme = createTheme({
    typography: {
        fontFamily: "Inter, sans-serif",
    },
    palette: {
        primary: {
            main: "#1E879F",
        },
        background: {
            default: "#e8eff1ff",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    backgroundColor: "#1E879F",
                    "&:hover": {
                        backgroundColor: "#125868",
                    },
                    textTransform: "none",
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    "&.MuiAlert-standardError": {
                        backgroundColor: "#f5c7c7",
                        color: "#941C1C",
                    },
                    "&.MuiAlert-standardSuccess": {
                        backgroundColor: "#BFDEC1",
                        color: "#3D5C3F",
                    },
                },
            },
        },
    },
});

export default theme;