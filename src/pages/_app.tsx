import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/router';
import theme from '@/theme';
import '@fontsource/montserrat';
import Layout from '@/components/Layout';
import { TempUserProvider } from '@/contexts/TempUserContext';
import { MerchantProvider } from '@/contexts/MerchantContext'; // ✅ import aqui

export default function MyApp({ Component, pageProps }: AppProps) {
    const [queryClient] = useState(() => new QueryClient());
    const router = useRouter();

    const noLayoutRoutes = ['/login', '/new-password', '/reset-password'];
    const hideLayout =
        noLayoutRoutes.includes(router.pathname) ||
        noLayoutRoutes.some((r) => router.pathname.startsWith(`${r}/`));

    const content = hideLayout ? (
        <Component {...pageProps} />
    ) : (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );

    return (
        <TempUserProvider>
            {/* ✅ Adiciona o MerchantProvider envolvendo o app */}
            <MerchantProvider>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        {content}
                    </ThemeProvider>
                </QueryClientProvider>
            </MerchantProvider>
        </TempUserProvider>
    );
}
