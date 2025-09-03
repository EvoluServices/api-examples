'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';

import { NavbarProps } from '@/interfaces/navbar';

const Navbar = ({ pages }: NavbarProps) => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <AppBar
            position="static"
            color="primary"
            elevation={0}
        >
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                    {pages.map((page) => (
                        <Link key={page.href} href={page.href} passHref>
                            <Button
                                disableRipple
                                sx={{
                                    borderBottom: isActive(page.href) ? '2px solid #fff' : '2px solid transparent',
                                    borderRadius: 0,
                                    textTransform: 'none',
                                    opacity: isActive(page.href) ? 1 : 0.8,
                                    transition: 'color 0.3s ease, border-bottom 0.3s ease, opacity 0.3s',
                                    '&:hover': {
                                        opacity: 1,
                                        borderBottom: '2px solid #fff',
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: '#FFF',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        fontFamily: 'Inter, Roboto, sans-serif',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {page.name}
                                </Typography>
                            </Button>
                        </Link>
                    ))}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
