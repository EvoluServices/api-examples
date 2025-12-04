import React, { useState } from 'react';
import { useRouter } from 'next/router';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 380,
    bgcolor: '#fff',
    color: '#333',
    borderRadius: 6,
    boxShadow: '0px 4px 25px rgba(0,0,0,0.15)',
    p: 4,

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 2,
};

function UserMenu() {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openModal, setOpenModal] = useState(false);

    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => setAnchorEl(null);

    const iconStyle = {
        width: '30px',
        height: '30px',
        color: '#fff',
    };

    const logout = async () => {
        try {
            await fetch('/api/session/destroy', { method: 'POST' });
        } catch (e) {
            console.error('Erro ao encerrar sessão:', e);
        } finally {
            router.push('/login');
        }
    };

    const handleOpenLogoutModal = () => {
        handleClose(); // Fecha o menu
        setOpenModal(true);
    };

    const handleCloseModal = () => setOpenModal(false);

    const handleConfirmLogout = () => {
        setOpenModal(false);
        logout();
    };

    return (
        <div>
            <IconButton
                aria-label="conta do usuário atual"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleClick}
                color="inherit"
            >
                <AccountCircleIcon style={iconStyle} />
            </IconButton>

            {/* MENU */}
            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleOpenLogoutModal}>
                    Sair
                </MenuItem>
            </Menu>

            {/* MODAL DE CONFIRMAÇÃO */}
            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="modal-title"
            >
                <Box sx={modalStyle}>
                    <Typography id="modal-title" variant="h6">
                        Deseja realmente sair?
                    </Typography>

                    <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                        <Button variant="outlined"
                          onClick={handleCloseModal}
                          sx={{
                              color: '#0071EB',
                              border: '#0071EB',
                              borderRadius: 3,
                              '&:hover': {
                                  border: '#0071EB',
                                  color: '#0071EB',
                          }
                        }}
                        >
                            Cancelar
                        </Button>


                        <Button variant="outlined"
                          onClick={handleConfirmLogout}
                          sx={{
                              backgroundColor: '#0071EB',
                              color: '#fff',
                              borderRadius: 3,
                              '&:hover': {
                                  backgroundColor: '#0071EB',
                          }
                        }}
                        >
                            Confirmar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default UserMenu;
