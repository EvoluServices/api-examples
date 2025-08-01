import Navbar from '@/components/Navbar';

export default function Layout() {
    return (
        <>
            <Navbar
                pages={[
                    { href: '/', name: 'Nova Venda' },
                    // { href: '/config', name: 'Configurações' },
                ]}
            />
        </>
    );
}