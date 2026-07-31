import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, CircularProgress, Divider, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { getApiErrorMessage, getApiValidationErrors } from '../../../api/client'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { FormCard } from '../../../components/form/FormCard'
import { FormMultiSelect } from '../../../components/form/FormMultiSelect'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { FormPasswordField } from '../../../components/form/FormPasswordField'
import { FormTextField } from '../../../components/form/FormTextField'
import { TEXTS } from '../../../config/texts'
import { useProfiles } from '../../profiles/api'
import { createUser } from '../api'
import { userRegisterSchema } from '../schemas'
import type { UserRegisterForm } from '../schemas'
import { UserAvatar } from '../components/UserAvatar'

export function UserRegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useFeedback()
  const { data: profiles = [], isLoading: isLoadingProfiles, error: profilesError } = useProfiles()
  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { isValid },
  } = useForm<UserRegisterForm>({
    defaultValues: {
      username: '',
      fullName: '',
      password: '',
      profiles: [],
    },
    mode: 'onChange',
    resolver: zodResolver(userRegisterSchema),
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      showSuccess(TEXTS.users.registerPage.success)
      navigate('/users', { replace: true })
    },
    onError: (error) => {
      const fieldErrors = getApiValidationErrors(error)
      let hasFieldErrors = false

      if (fieldErrors.username) {
        setError('username', { message: fieldErrors.username, type: 'server' })
        hasFieldErrors = true
      }
      if (fieldErrors.password) {
        setError('password', { message: fieldErrors.password, type: 'server' })
        hasFieldErrors = true
      }
      if (fieldErrors.fullName) {
        setError('fullName', { message: fieldErrors.fullName, type: 'server' })
        hasFieldErrors = true
      }
      if (fieldErrors.profiles) {
        setError('profiles', { message: fieldErrors.profiles, type: 'server' })
        hasFieldErrors = true
      }

      if (!hasFieldErrors) {
        showError(getApiErrorMessage(error) || TEXTS.users.registerPage.unexpectedError)
      }
    },
  })

  const isSubmitting = createMutation.isPending
  const profileOptions = profiles.map((profile) => ({ label: profile.name, value: profile.id }))
  const fullName = watch('fullName')

  return (
    <FormPageLayout
      description={TEXTS.users.registerPage.description}
      parent={{ label: TEXTS.users.title, to: '/users' }}
      title={TEXTS.users.registerPage.title}
    >
      {profilesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No fue posible cargar los perfiles disponibles.
        </Alert>
      )}

      <FormCard onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          <UserAvatar editable fullName={fullName} size={96} />
          <div className="text-center sm:text-left">
            <Typography sx={{ fontWeight: 700 }}>Imagen de perfil</Typography>
            <Typography color="text.secondary" sx={{ mb: 1.5, mt: 0.5 }} variant="body2">
              El espacio está preparado para asociar una imagen cuando esté disponible el servicio de archivos.
            </Typography>
            <Button
              disabled
              startIcon={<MaterialSymbol name="add_a_photo" size={20} />}
              variant="outlined"
            >
              Agregar foto próximamente
            </Button>
          </div>
        </div>
        <Divider sx={{ mb: 3 }} />

        <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
          <FormTextField
            autoComplete="email"
            control={control}
            disabled={isSubmitting}
            label={TEXTS.users.registerPage.email}
            name="username"
            required
            type="email"
          />
          <FormPasswordField
            control={control}
            disabled={isSubmitting}
            hint={TEXTS.users.registerPage.passwordHint}
            label={TEXTS.users.registerPage.password}
            name="password"
            required
          />
          <div className="md:col-span-2">
            <FormTextField
              autoComplete="name"
              control={control}
              disabled={isSubmitting}
              label={TEXTS.users.registerPage.fullName}
              name="fullName"
              required
            />
          </div>
          <div className="md:col-span-2">
            <FormMultiSelect
              control={control}
              disabled={isLoadingProfiles || isSubmitting}
              hint={TEXTS.users.registerPage.profilesHint}
              label={TEXTS.users.registerPage.profiles}
              name="profiles"
              options={profileOptions}
              required
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            disabled={isSubmitting}
            onClick={() => navigate('/users')}
            startIcon={<MaterialSymbol name="arrow_back" size={20} />}
            variant="outlined"
          >
            {TEXTS.users.registerPage.cancel}
          </Button>
          <Button
            disabled={!isValid || isLoadingProfiles || isSubmitting}
            startIcon={isSubmitting
              ? <CircularProgress color="inherit" size={18} />
              : <MaterialSymbol name="person_add" size={20} />}
            type="submit"
            variant="contained"
          >
            {TEXTS.users.registerPage.submit}
          </Button>
        </div>
      </FormCard>
    </FormPageLayout>
  )
}
