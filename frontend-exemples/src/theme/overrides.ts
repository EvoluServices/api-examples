import { Components } from '@mui/material/styles';

export const components: Components = {
    MuiAlert: {
        styleOverrides: {
            root: {
                '&.MuiAlert-standardError': {
                    backgroundColor: '#f5c7c7',
                    color: '#941C1C',
                },
                '&.MuiAlert-standardSuccess': {
                    backgroundColor: '#BFDEC1',
                    color: '#3D5C3F',
                },
            },
        },
    },
};
