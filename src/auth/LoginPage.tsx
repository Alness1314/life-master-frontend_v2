import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { getApiErrorMessage } from '../api/client'
import { MaterialSymbol } from '../components/icons/MaterialSymbol'
import { useColorMode } from '../theme/useColorMode'
import { useAuth } from './useAuth'

const backgroundImage = '/img/login-background.jpg'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const { mode, toggleColorMode } = useColorMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(username.trim(), password)
      const destination = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname ?? '/dashboard'
      navigate(destination, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error && loginError.message.includes('sesión inválida')
        ? loginError.message
        : getApiErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDark = mode === 'dark'

  return (
    <main className="login-page grid min-h-screen overflow-x-hidden lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <section
        className="relative hidden min-w-0 overflow-hidden lg:flex lg:min-h-0 lg:flex-col lg:justify-between"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 6, 35, .52), rgba(3, 18, 34, .7)), url(${backgroundImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="p-10 xl:p-14">
          <img className="h-14 max-w-52 object-contain brightness-0 invert" src="/img/full_logo.png" alt="Life Master" />
        </div>

        <div className="login-hero-copy absolute left-0 top-1/2 max-w-2xl -translate-y-1/2 px-10 text-white xl:px-14">
          <Typography component="h1" sx={{ fontSize: { lg: 42, xl: 50 }, fontWeight: 800, lineHeight: 1.12 }}>
            Organiza hoy la vida que quieres mañana.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.78)', fontSize: 18, mt: 2, maxWidth: 550 }}>
            Tus finanzas, actividades y objetivos en un espacio diseñado para mantener el control.
          </Typography>
        </div>

        <div className="absolute bottom-6 right-8 text-right text-sm text-white/70 xl:right-12">
          © 2026 Life Master. Todos los derechos reservados.
        </div>
      </section>

      <Paper
        component="section"
        className="login-form-panel relative flex min-h-screen min-w-0 items-center justify-center px-5 py-20 sm:px-10 lg:min-h-0"
        elevation={0}
        square
        sx={{ bgcolor: 'background.default' }}
      >
        <div className="absolute right-4 top-3 sm:right-7 sm:top-5">
          <FormControlLabel
            control={<Switch checked={isDark} color="primary" onChange={toggleColorMode} />}
            label={
              <span className="flex items-center gap-2 text-sm">
                <MaterialSymbol name={isDark ? 'dark_mode' : 'light_mode'} size={20} />
                {isDark ? 'Modo oscuro' : 'Modo claro'}
              </span>
            }
          />
        </div>

        <div className="login-form-shell w-full max-w-[450px] px-3 py-8 sm:px-7 sm:py-10">
          <div className="login-form-header mb-9 text-center">
            <img className="login-form-logo mx-auto mb-5 h-20 w-20 object-contain" src="/img/logo.png" alt="Life Master" />
            <Typography variant="h4" component="h2" sx={{ fontSize: { xs: 27, sm: 30 } }}>
              Inicio de sesión
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Ingresa tu usuario y contraseña para continuar.
            </Typography>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

            <Stack spacing={2.25}>
              <TextField
                autoComplete="username"
                autoFocus
                disabled={isSubmitting}
                fullWidth
                label="Usuario"
                onChange={(event) => setUsername(event.target.value)}
                required
                value={username}
              />
              <TextField
                autoComplete="current-password"
                disabled={isSubmitting}
                fullWidth
                label="Contraseña"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          edge="end"
                          onClick={() => setShowPassword((visible) => !visible)}
                          size="small"
                        >
                          <MaterialSymbol name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            <Button
              disabled={isSubmitting}
              fullWidth
              size="large"
              sx={{ mt: 3.5 }}
              type="submit"
              variant="contained"
            >
              {isSubmitting ? <CircularProgress color="inherit" size={22} /> : 'Ingresar'}
            </Button>
            <Button
              color="primary"
              fullWidth
              size="small"
              sx={{ color: isDark ? 'primary.light' : 'primary.main', minHeight: 32, mt: 1.25 }}
              type="button"
              variant="text"
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </form>
        </div>

        <div className="absolute bottom-5 text-center text-xs text-gray-500 lg:hidden">
          © 2026 Life Master
        </div>
      </Paper>
    </main>
  )
}
