import { z } from 'zod'

export const userRegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio.')
    .max(256, 'El correo no puede superar 256 caracteres.')
    .email('Ingresa una dirección de correo electrónico válida.'),
  fullName: z
    .string()
    .trim()
    .min(1, 'El nombre completo es obligatorio.')
    .max(256, 'El nombre no puede superar 256 caracteres.'),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres.')
    .max(128, 'La contraseña no puede superar 128 caracteres.'),
  profiles: z
    .array(z.string().uuid())
    .min(1, 'Selecciona al menos un perfil.'),
})

export type UserRegisterForm = z.infer<typeof userRegisterSchema>
