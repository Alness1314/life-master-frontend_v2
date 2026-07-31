export interface JwtPayload {
  id: string
  sub: string
  admin?: boolean
  exp: number
}

export interface AuthUser {
  id: string
  username: string
  isAdmin: boolean
}

export interface LoginResponse {
  token: string
  message: string
  code: string
}

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}
