import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export function getAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#7567e8',
        dark: '#5d50c9',
        light: '#9e95f0',
      },
      secondary: {
        main: '#7567e8',
      },
      background: {
        default: isDark ? '#111318' : '#f6f7fb',
        paper: isDark ? '#1b1e24' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 6,
    },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      h4: { fontWeight: 750 },
      h5: { fontWeight: 700 },
      button: { fontWeight: 700, textTransform: 'none' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            alignItems: 'center',
            borderRadius: 5,
            minHeight: 44,
            '& .MuiButton-startIcon': {
              alignItems: 'center',
              display: 'inline-flex',
              justifyContent: 'center',
              marginLeft: 0,
              marginRight: 7,
            },
            '& .MuiButton-startIcon > *': {
              lineHeight: 1,
            },
          },
          contained: {
            '&.MuiButton-colorPrimary': {
              backgroundColor: '#6759d8',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#5d50c9',
              },
              '&:focus-visible': {
                backgroundColor: '#6759d8',
                boxShadow: '0 0 0 3px rgba(117, 103, 232, .28)',
              },
              '&:active': {
                backgroundColor: '#5145b4',
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
          },
          input: {
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          asterisk: {
            color: '#ef5350',
            marginLeft: 3,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 7,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 7,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#181a1f' : '#ffffff',
            color: isDark ? '#f4f4f5' : '#20222a',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#181a1f' : '#ffffff',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            colorScheme: mode,
            scrollbarColor: isDark ? '#4a4d55 #181a1f' : '#b5b8c0 #f6f7fb',
          },
          body: {
            scrollbarColor: isDark ? '#4a4d55 #181a1f' : '#b5b8c0 #f6f7fb',
          },
          '*::-webkit-scrollbar': {
            width: 10,
            height: 10,
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: isDark ? '#181a1f' : '#f6f7fb',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? '#4a4d55' : '#b5b8c0',
            border: `2px solid ${isDark ? '#181a1f' : '#f6f7fb'}`,
          },
        },
      },
    },
  })
}
