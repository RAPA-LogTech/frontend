import { Box, Typography } from '@mui/material'

type NoDataStateProps = {
  title?: string
  description?: string
}

export default function NoDataState({
  title = 'No data',
  description = '조건에 맞는 데이터가 없습니다.',
}: NoDataStateProps) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {description}
      </Typography>
    </Box>
  )
}
