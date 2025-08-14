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
                                    borderBottom: isActive(page.href) ? '2px solid #fff' : 'none',
                                    borderRadius: 0,
                                    textTransform: 'none',
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: '#FFF',
                                        fontSize: '16px',
                                        fontWeight: isActive(page.href) ? 700 : 400,
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
