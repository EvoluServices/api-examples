'use client';
import { AppProps } from "next/app";
import { ThemeProvider, CssBaseline, GlobalStyles } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import theme from "@/theme/theme";
import Navbar from '../components/Navbar';
import '@fontsource/montserrat';

export default function MyApp({ Component, pageProps }: AppProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                {/* Aplica o CssBaseline para resetar o CSS */}
                <CssBaseline />
                 {/* Navbar aparece em todas as páginas */}
                <Navbar />
                {/* Adiciona o estilo global para ocultar o scroll */}

                {/* Carrega a página normalmente */}
                <Component {...pageProps} />
            </ThemeProvider>
        </QueryClientProvider>
    );
}