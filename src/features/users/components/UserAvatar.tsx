import { Avatar, Box } from '@mui/material'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'

interface UserAvatarProps {
  fullName?: string
  imageUrl?: string | null
  size?: number
  editable?: boolean
}

function getInitials(fullName?: string) {
  if (!fullName?.trim()) return 'U'
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function UserAvatar({
  fullName,
  imageUrl,
  size = 104,
  editable = false,
}: UserAvatarProps) {
  return (
    <Box sx={{ display: 'inline-flex', position: 'relative' }}>
      <Avatar
        alt={fullName || 'Usuario'}
        src={imageUrl || undefined}
        sx={{
          bgcolor: 'primary.main',
          border: '4px solid',
          borderColor: 'background.paper',
          boxShadow: 2,
          fontSize: size * 0.3,
          fontWeight: 750,
          height: size,
          width: size,
        }}
      >
        {getInitials(fullName)}
      </Avatar>
      {editable && (
        <Box
          aria-hidden="true"
          sx={{
            alignItems: 'center',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '50%',
            bottom: 2,
            display: 'flex',
            height: 32,
            justifyContent: 'center',
            position: 'absolute',
            right: 2,
            width: 32,
          }}
        >
          <MaterialSymbol name="photo_camera" size={18} />
        </Box>
      )}
    </Box>
  )
}
