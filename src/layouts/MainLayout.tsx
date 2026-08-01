import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { MouseEvent } from 'react'
import { MaterialSymbol } from '../components/icons/MaterialSymbol'
import { useAuth } from '../auth/useAuth'
import { useColorMode } from '../theme/useColorMode'
import { useModulePermission, useSidebarModules } from '../features/modules/api'
import type { SidebarModule } from '../features/modules/api'
import { useCurrentUser } from '../features/users/api'
import { apiClient } from '../api/client'
import { API_ROUTES } from '../config/apiRoutes'
import { blobToDataUrl } from '../features/users/profileImage'
import { ModuleAccessBoundary } from '../features/modules/ModuleAccessBoundary'

const drawerWidth = 278

const materialIconAliases: Record<string, string> = {
  users: 'group',
}

function getModuleIcon(module: SidebarModule) {
  const configuredIcon = module.iconName?.trim().toLowerCase()
  const icon = configuredIcon && configuredIcon !== 'none'
    ? (materialIconAliases[configuredIcon] ?? configuredIcon)
    : 'widgets'
  return <MaterialSymbol name={icon} />
}

function getSidebarRoute(module: SidebarModule) {
  const isCatalogs = module.name.toLowerCase() === 'catálogos'
    || module.name.toLowerCase() === 'catalogos'
  return isCatalogs ? '/catalogs' : module.route
}

export function MainLayout() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const location = useLocation()
  const { user, logout } = useAuth()
  const { mode, toggleColorMode } = useColorMode()
  const isDark = mode === 'dark'
  const { data: currentUser } = useCurrentUser()
  const profileImageQuery = useQuery({
    queryKey: ['profile-image', user?.id, currentUser?.imageId],
    queryFn: async () => blobToDataUrl((
      await apiClient.get<Blob>(
        API_ROUTES.files.content(user!.id, currentUser!.imageId!),
        { responseType: 'blob' },
      )
    ).data),
    enabled: Boolean(user && currentUser?.imageId),
  })
  const { data: sidebarModules = [] } = useSidebarModules()
  const dashboardAccess = useModulePermission('dashboard')
  const navigation = [
    ...(dashboardAccess.canRead ? [{
      id: 'fixed-dashboard',
      name: 'Dashboard',
      route: '/dashboard',
      icon: <MaterialSymbol name="monitoring" />,
    }] : []),
    ...sidebarModules.filter((module) => module.route !== '/dashboard').map((module) => ({
      id: module.id,
      name: module.name,
      route: getSidebarRoute(module),
      icon: getModuleIcon(module),
    })),
  ]
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const currentTitle = navigation.find((item) => location.pathname.startsWith(item.route))?.name ?? 'Life Master'
  const openProfile = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)

  const drawer = (
    <Box
      className="flex h-full flex-col"
      sx={{
        bgcolor: isDark ? '#181a1f' : '#ffffff',
        color: isDark ? '#f4f4f5' : '#272932',
      }}
    >
      <div className="flex h-[104px] items-center justify-between px-6">
        <img className="h-[68px] max-w-[210px] object-contain" src="/img/full_logo.png" alt="Life Master" />
        {!isDesktop && (
          <IconButton aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} color="inherit">
            <MaterialSymbol name="close" />
          </IconButton>
        )}
      </div>
      {/* <Divider sx={{ mx: '5%', width: '90%' }} /> */}
      <List className="flex-1 px-3 py-5">
        {navigation.map((module) => (
          <ListItemButton
            component={NavLink}
            key={module.id}
            onClick={() => setMobileOpen(false)}
            selected={location.pathname.startsWith(module.route)}
            to={module.route}
            sx={{
              borderRadius: 1,
              color: isDark ? 'rgba(255,255,255,.72)' : 'rgba(30,32,40,.72)',
              mb: 0.75,
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 42 },
              '&.Mui-selected': {
                bgcolor: isDark ? '#303238' : '#ececf0',
                color: isDark ? '#fff' : '#1f2026',
                '&:hover': { bgcolor: isDark ? '#383a41' : '#e4e4e9' },
              },
              '&:hover': {
                bgcolor: isDark ? '#25272c' : '#f3f3f5',
                color: isDark ? '#fff' : '#1f2026',
              },
            }}
          >
            <ListItemIcon>{module.icon}</ListItemIcon>
            <ListItemText primary={module.name} slotProps={{ primary: { sx: { fontWeight: 650 } } }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ mx: '5%', width: '90%' }} />
      <List className="px-3 py-3">
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 1,
            '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 42 },
          }}
        >
          <ListItemIcon><MaterialSymbol name="logout" /></ListItemIcon>
          <ListItemText primary="Cerrar sesión" slotProps={{ primary: { sx: { fontWeight: 650 } } }} />
        </ListItemButton>
      </List>
      <Typography color="text.secondary" className="px-6 pb-5 text-right" variant="caption">Life Master v2</Typography>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, sm: 3 } }}>
          {!isDesktop && (
            <IconButton aria-label="Abrir menú" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MaterialSymbol name="menu" />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 750 }}>
            {currentTitle}
          </Typography>
          <Tooltip title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            <IconButton aria-label="Cambiar tema" onClick={toggleColorMode} sx={{ mr: 1 }}>
              <MaterialSymbol name={mode === 'dark' ? 'light_mode' : 'dark_mode'} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cuenta">
            <IconButton onClick={openProfile} size="small">
              <Avatar
                src={profileImageQuery.data || '/img/usuario.png'}
                alt={currentUser?.fullName || user?.username}
                sx={{ width: 38, height: 38 }}
              />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            onClose={() => setAnchorEl(null)}
            open={Boolean(anchorEl)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 190 }}>
              <Typography sx={{ fontWeight: 700 }}>{currentUser?.fullName || user?.username}</Typography>
              <Typography color="text.secondary" variant="caption">
                {currentUser?.username || user?.username}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile') }}>Mi perfil</MenuItem>
            <MenuItem onClick={logout}>Cerrar sesión</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          variant="temporary"
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 0 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: '100dvh',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        <div className="mx-auto min-h-0 w-full max-w-[1800px] flex-1 overflow-hidden px-3 py-5 sm:px-4 sm:py-7">
          <ModuleAccessBoundary>
            <Outlet />
          </ModuleAccessBoundary>
        </div>
      </Box>
    </Box>
  )
}
