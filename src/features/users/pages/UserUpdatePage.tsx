import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, CircularProgress, Divider, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage, getApiValidationErrors } from '../../../api/client'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { FormCard } from '../../../components/form/FormCard'
import { FormMultiSelect } from '../../../components/form/FormMultiSelect'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { FormPasswordField } from '../../../components/form/FormPasswordField'
import { FormTextField } from '../../../components/form/FormTextField'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { TEXTS } from '../../../config/texts'
import { useProfiles } from '../../profiles/api'
import { updateUser, useUser } from '../api'
import { UserAvatar } from '../components/UserAvatar'
import { userRegisterSchema } from '../schemas'
import type { UserRegisterForm } from '../schemas'

export function UserUpdatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { userId } = useParams()
  const { showError, showSuccess } = useFeedback()
  const { data: user, isLoading: isLoadingUser, error: userError } = useUser(userId)
  const { data: profiles = [], isLoading: isLoadingProfiles, error: profilesError } = useProfiles()
  const {
    control,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (!user) return
    reset({
      username: user.username,
      fullName: user.fullName,
      password: '',
      profiles: user.profiles.map((profile) => profile.id),
    })
  }, [reset, user])

  const updateMutation = useMutation({
    mutationFn: (values: UserRegisterForm) => updateUser(userId!, {
      ...values,
      imageId: user?.imageId ?? null,
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['users', userId] }),
      ])
      showSuccess(TEXTS.users.updatePage.success)
      navigate('/users', { replace: true })
    },
    onError: (error) => {
      const fieldErrors = getApiValidationErrors(error)
      let hasFieldErrors = false

      for (const field of ['username', 'password', 'fullName', 'profiles'] as const) {
        if (!fieldErrors[field]) continue
        setError(field, { message: fieldErrors[field], type: 'server' })
        hasFieldErrors = true
      }

      if (!hasFieldErrors) {
        showError(getApiErrorMessage(error) || TEXTS.users.updatePage.unexpectedError)
      }
    },
  })

  const isSubmitting = updateMutation.isPending
  const profileOptions = profiles.map((profile) => ({ label: profile.name, value: profile.id }))
  const fullName = watch('fullName')

  return (
    <FormPageLayout
      description={TEXTS.users.updatePage.description}
      parent={{ label: TEXTS.users.title, to: '/users' }}
      title={TEXTS.users.updatePage.title}
    >
      {isLoadingUser && (
        <div className="grid min-h-64 place-items-center">
          <CircularProgress aria-label="Cargando usuario" />
        </div>
      )}

      {userError && <Alert severity="error">{TEXTS.users.updatePage.errorLoading}</Alert>}
      {profilesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No fue posible cargar los perfiles disponibles.
        </Alert>
      )}

      {user && (
        <FormCard onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
          <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
            <UserAvatar editable fullName={fullName} size={96} />
            <div className="text-center sm:text-left">
              <Typography sx={{ fontWeight: 700 }}>Imagen de perfil</Typography>
              <Typography color="text.secondary" sx={{ mb: 1.5, mt: 0.5 }} variant="body2">
                {user.imageId
                  ? 'El usuario tiene una imagen asociada. Su referencia se conservará al guardar.'
                  : 'La imagen podrá modificarse cuando esté disponible el servicio de archivos.'}
              </Typography>
              <Button
                disabled
                startIcon={<MaterialSymbol name="add_a_photo" size={20} />}
                variant="outlined"
              >
                Cambiar foto próximamente
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
              hint={TEXTS.users.updatePage.passwordHint}
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
              {TEXTS.users.updatePage.cancel}
            </Button>
            <Button
              disabled={!isValid || isLoadingProfiles || isSubmitting}
              startIcon={isSubmitting
                ? <CircularProgress color="inherit" size={18} />
                : <MaterialSymbol name="save" size={20} />}
              type="submit"
              variant="contained"
            >
              {TEXTS.users.updatePage.submit}
            </Button>
          </div>
        </FormCard>
      )}
    </FormPageLayout>
  )
}
