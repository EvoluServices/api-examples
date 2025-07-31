'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppBar, Toolbar, Button, Box } from '@mui/material';

const Navbar = () => {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <AppBar position="static" sx={{ backgroundColor: '#468899', boxShadow: 'none' }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 3 }}>
          <Link href="/" passHref legacyBehavior>
            <Button
              disableRipple
              sx={{
                color: 'white',
                fontWeight: isActive('/') ? 'bold' : 'normal',
                borderBottom: isActive('/') ? '2px solid white' : 'none',
                borderRadius: 0,
                textTransform: 'none',
                backgroundColor: 'transparent', // fundo sempre transparente
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)', // efeito ao passar o mouse
                },
              }}
            >
              Nova Venda
            </Button>
          </Link>

          
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
