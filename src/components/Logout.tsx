import React, {useState} from 'react';
import {useRouter} from 'next/router';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ListItemIcon from '@mui/material/ListItemIcon';

function UserMenu() {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const iconStyle = {
        width: '30px',
        height: '30px',
        color: '#fff',
    };

    const handleLogout = () => {
        document.cookie = 'api-examples-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        handleClose();
        router.push('/login');
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
                <AccountCircleIcon

                    style={iconStyle }/>

            </IconButton>
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
                <MenuItem onClick={handleLogout}>
                    Sair
                </MenuItem>
            </Menu>
        </div>
    );
}

export default UserMenu;









