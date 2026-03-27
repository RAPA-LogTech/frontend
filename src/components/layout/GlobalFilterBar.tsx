'use client'

import React, { useState } from 'react'
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Button,
  Collapse,
  Alert,
  Stack,
  TextField,
  Chip,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { GlobalFilterState, Environment, LogLevel } from '@/lib/types'

const globalFilterOptions = {
  timeRanges: [
    { label: 'Last 15m', value: '15m' },
    { label: 'Last 1h', value: '1h' },
    { label: 'Last 6h', value: '6h' },
    { label: 'Last 24h', value: '24h' },
    { label: 'Last 7d', value: '7d' },
  ],
  services: ['todolist', 'flask', 'thymeleaf', 'springboot', 'postgres'],
  envs: ['prod', 'staging', 'dev'] as const,
  clusters: ['apne2-a', 'apne2-b'],
}

interface GlobalFilterBarProps {
  value: GlobalFilterState
  onChange: (filters: GlobalFilterState) => void
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ value, onChange }) => {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.only('xs'))
  const isMobileView = useMediaQuery(theme.breakpoints.down('md'))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const logLevels: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG']
  const [selectedLogLevels, setSelectedLogLevels] = useState<LogLevel[]>([])
  const selectedTimeRangeLabel =
    globalFilterOptions.timeRanges.find(tr => tr.value === value.timeRange)?.label ??
    value.timeRange

  const activeFilterCount =
    value.service.length +
    value.env.length +
    value.cluster.length +
    Object.keys(value.customTags ?? {}).length +
    (selectedLogLevels.length > 0 ? 1 : 0)

  const mobileSummaryItems = [
    `Time: ${selectedTimeRangeLabel}`,
    value.service.length > 0 ? `Service: ${value.service.join(', ')}` : 'Service: All',
    value.env.length > 0 ? `Env: ${value.env.join(', ')}` : 'Env: All',
    value.cluster.length > 0 ? `Cluster: ${value.cluster.join(', ')}` : 'Cluster: All',
  ]

  const handleTimeRangeChange = (timeRange: string) => {
    onChange({
      ...value,
      timeRange,
    })
  }

  const handleServiceChange = (service: string | string[]) => {
    const selected = Array.isArray(service) ? service : [service]
    onChange({
      ...value,
      service: selected,
    })
  }

  const handleEnvChange = (env: string | string[]) => {
    const selected = Array.isArray(env) ? (env as Environment[]) : ([env] as Environment[])
    onChange({
      ...value,
      env: selected,
    })
  }

  const handleClusterChange = (cluster: string | string[]) => {
    const selected = Array.isArray(cluster) ? cluster : [cluster]
    onChange({
      ...value,
      cluster: selected,
    })
  }

  const handleReset = () => {
    onChange({
      timeRange: '1h',
      service: [],
      env: ['prod'],
      cluster: [],
      customTags: {},
      startTime: undefined,
      endTime: undefined,
    })
    setSelectedLogLevels([])
    setTagInput('')
  }

  const handleAddTag = (key: string, tagValue: string) => {
    if (key.trim() === '' || tagValue.trim() === '') return

    const newTags = { ...value.customTags, [key]: [tagValue] }
    onChange({ ...value, customTags: newTags })
    setTagInput('')
  }

  const handleRemoveTag = (key: string) => {
    const newTags = { ...value.customTags }
    delete newTags[key]
    onChange({ ...value, customTags: newTags })
  }

  const handleDateChange = (type: 'start' | 'end', dateStr: string) => {
    const timestamp = new Date(dateStr).getTime()
    if (isNaN(timestamp)) return

    if (type === 'start') {
      onChange({ ...value, startTime: timestamp })
    } else {
      onChange({ ...value, endTime: timestamp })
    }
  }

  const handleLogLevelChange = (levels: LogLevel[]) => {
    setSelectedLogLevels(levels)
    // Log levels are stored in component state for now
  }

  const formatDateForInput = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toISOString().slice(0, 10)
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: isXs ? 'stretch' : 'center',
          flexDirection: isXs ? 'column' : 'row',
          gap: 1.5,
          minHeight: isXs ? 'auto' : '56px',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'),
          borderBottom: '1px solid',
          borderColor: theme => theme.palette.divider,
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 1.5,
          flexShrink: 0,
          overflow: 'visible',
          flexWrap: 'wrap',
          alignContent: 'center',
        }}
      >
        {isXs ? (
          <>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <Button
                variant={showMobileFilters ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setShowMobileFilters(prev => !prev)}
                sx={{
                  width: '100%',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  color: theme =>
                    showMobileFilters && theme.palette.mode === 'light' ? '#ffffff' : undefined,
                }}
              >
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: theme => theme.palette.text.secondary,
                display: 'block',
                lineHeight: 1.4,
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {mobileSummaryItems.join(' · ')}
            </Typography>

            <Collapse in={showMobileFilters} sx={{ width: '100%' }}>
              <Stack gap={1} sx={{ pt: 1, width: '100%' }}>
                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    value={value.timeRange}
                    onChange={e => handleTimeRangeChange(e.target.value)}
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.divider,
                      },
                    }}
                  >
                    {globalFilterOptions.timeRanges.map(tr => (
                      <MenuItem key={tr.value} value={tr.value}>
                        {tr.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    multiple
                    value={value.service}
                    onChange={e => handleServiceChange(e.target.value)}
                    displayEmpty
                    renderValue={selected =>
                      selected.length === 0 ? 'All Services' : selected.join(', ')
                    }
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.divider,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>All Services</em>
                    </MenuItem>
                    {globalFilterOptions.services.map(service => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    multiple
                    value={value.env}
                    onChange={e => handleEnvChange(e.target.value)}
                    displayEmpty
                    renderValue={selected =>
                      selected.length === 0 ? 'All Envs' : selected.join(', ')
                    }
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.divider,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>All Envs</em>
                    </MenuItem>
                    {globalFilterOptions.envs.map(env => (
                      <MenuItem key={env} value={env}>
                        {env}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    multiple
                    value={value.cluster}
                    onChange={e => handleClusterChange(e.target.value)}
                    displayEmpty
                    renderValue={selected =>
                      selected.length === 0 ? 'All Clusters' : selected.join(', ')
                    }
                    sx={{
                      color: theme => theme.palette.text.primary,
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.divider,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>All Clusters</em>
                    </MenuItem>
                    {globalFilterOptions.clusters.map(cluster => (
                      <MenuItem key={cluster} value={cluster}>
                        {cluster}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" gap={1}>
                  <Button
                    variant={showAdvanced ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    sx={{
                      flex: 1,
                      bgcolor: theme => (showAdvanced ? theme.palette.primary.main : 'transparent'),
                      color: theme => (showAdvanced ? '#fff' : theme.palette.text.secondary),
                      borderColor: theme => theme.palette.divider,
                      textTransform: 'none',
                    }}
                  >
                    Advanced
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleReset}
                    sx={{
                      flex: 1,
                      color: theme => theme.palette.text.secondary,
                      borderColor: theme => theme.palette.divider,
                      textTransform: 'none',
                    }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Collapse>
          </>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 1.5,
                flex: 1,
                minWidth: 0,
              }}
            >
              <FormControl size="small" sx={{ width: '100%' }}>
                <Select
                  value={value.timeRange}
                  onChange={e => handleTimeRangeChange(e.target.value)}
                  sx={{
                    color: theme => theme.palette.text.primary,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.divider,
                    },
                  }}
                >
                  {globalFilterOptions.timeRanges.map(tr => (
                    <MenuItem key={tr.value} value={tr.value}>
                      {tr.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: '100%' }}>
                <Select
                  multiple
                  value={value.service}
                  onChange={e => handleServiceChange(e.target.value)}
                  displayEmpty
                  renderValue={selected =>
                    selected.length === 0 ? 'All Services' : selected.join(', ')
                  }
                  sx={{
                    color: theme => theme.palette.text.primary,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.divider,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Services</em>
                  </MenuItem>
                  {globalFilterOptions.services.map(service => (
                    <MenuItem key={service} value={service}>
                      {service}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: '100%' }}>
                <Select
                  multiple
                  value={value.env}
                  onChange={e => handleEnvChange(e.target.value)}
                  displayEmpty
                  renderValue={selected =>
                    selected.length === 0 ? 'All Envs' : selected.join(', ')
                  }
                  sx={{
                    color: theme => theme.palette.text.primary,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.divider,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Envs</em>
                  </MenuItem>
                  {globalFilterOptions.envs.map(env => (
                    <MenuItem key={env} value={env}>
                      {env}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: '100%' }}>
                <Select
                  multiple
                  value={value.cluster}
                  onChange={e => handleClusterChange(e.target.value)}
                  displayEmpty
                  renderValue={selected =>
                    selected.length === 0 ? 'All Clusters' : selected.join(', ')
                  }
                  sx={{
                    color: theme => theme.palette.text.primary,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme => theme.palette.divider,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Clusters</em>
                  </MenuItem>
                  {globalFilterOptions.clusters.map(cluster => (
                    <MenuItem key={cluster} value={cluster}>
                      {cluster}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Stack
              direction="row"
              gap={1}
              sx={{
                flexShrink: 0,
              }}
            >
              <Button
                variant={showAdvanced ? 'contained' : 'outlined'}
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => setShowAdvanced(!showAdvanced)}
                sx={{
                  bgcolor: theme => (showAdvanced ? theme.palette.primary.main : 'transparent'),
                  color: theme => (showAdvanced ? '#fff' : theme.palette.text.secondary),
                  borderColor: theme => theme.palette.divider,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: theme =>
                      showAdvanced ? theme.palette.primary.dark : theme.palette.action.hover,
                    borderColor: theme => theme.palette.primary.main,
                  },
                }}
                title="Advanced filters"
              >
                Advanced
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                sx={{
                  color: theme => theme.palette.text.secondary,
                  borderColor: theme => theme.palette.divider,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: theme => theme.palette.action.hover,
                    borderColor: theme => theme.palette.primary.main,
                  },
                }}
                title="Reset all filters"
              >
                Reset
              </Button>
            </Stack>
          </>
        )}
      </Box>

      {/* Advanced Filters - Desktop/Tablet inline panel */}
      {showAdvanced && !isMobileView && (
        <Box
          sx={{
            bgcolor: theme => theme.palette.background.paper,
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: theme => theme.palette.divider,
            maxHeight: { xs: '55vh', sm: '50vh', md: 'unset', lg: '48vh', xl: 'unset' },
            overflowY: { xs: 'auto', sm: 'auto', md: 'visible', lg: 'auto', xl: 'visible' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              position: { xs: 'sticky', sm: 'sticky', md: 'static', lg: 'sticky', xl: 'static' },
              top: 0,
              zIndex: 1,
              bgcolor: theme => theme.palette.background.paper,
              py: 0.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: theme => theme.palette.text.primary,
                fontWeight: 700,
              }}
            >
              Advanced Filters
            </Typography>
            <Button
              variant="text"
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => setShowAdvanced(false)}
              sx={{
                color: theme => theme.palette.text.secondary,
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
              }}
            >
              Close
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Date Range Section */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Start Time
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={formatDateForInput(value.startTime)}
                  onChange={e => handleDateChange('start', e.target.value)}
                  inputProps={{
                    style: { fontSize: '0.875rem' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme => theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  End Time
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={formatDateForInput(value.endTime)}
                  onChange={e => handleDateChange('end', e.target.value)}
                  inputProps={{
                    style: { fontSize: '0.875rem' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme => theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Log Level Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Log Levels
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    multiple
                    value={selectedLogLevels}
                    onChange={e =>
                      handleLogLevelChange(
                        typeof e.target.value === 'string'
                          ? (e.target.value.split(',').filter(Boolean) as LogLevel[])
                          : (e.target.value as LogLevel[])
                      )
                    }
                    displayEmpty
                    renderValue={selected =>
                      selected.length === 0 ? 'All Levels' : selected.join(', ')
                    }
                    sx={{
                      color: theme => theme.palette.text.primary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.divider,
                      },
                    }}
                  >
                    {logLevels.map(level => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Saved Presets */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Quick Presets
                </Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: theme => theme.palette.divider,
                      color: theme => theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme => theme.palette.primary.main,
                        bgcolor: theme => theme.palette.action.hover,
                      },
                    }}
                    onClick={() => {
                      onChange({ ...value, timeRange: '1h', env: ['prod'] })
                      setSelectedLogLevels(['ERROR'])
                    }}
                  >
                    Errors
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: theme => theme.palette.divider,
                      color: theme => theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme => theme.palette.primary.main,
                        bgcolor: theme => theme.palette.action.hover,
                      },
                    }}
                    onClick={() => {
                      onChange({ ...value, timeRange: '24h', env: ['prod', 'staging'] })
                    }}
                  >
                    Last 24h
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {/* Custom Tags Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Custom Tags
                </Typography>

                <Stack direction="row" gap={1} alignItems="flex-start" flexWrap="wrap">
                  <TextField
                    placeholder="key:value"
                    size="small"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const [key, val] = tagInput.split(':')
                        handleAddTag(key.trim(), val?.trim() || '')
                      }
                    }}
                    sx={{
                      width: '200px',
                      '& .MuiOutlinedInput-root': {
                        color: theme => theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: theme => theme.palette.divider,
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      const [key, val] = tagInput.split(':')
                      handleAddTag(key.trim(), val?.trim() || '')
                    }}
                    sx={{
                      textTransform: 'none',
                      mt: 0.5,
                    }}
                  >
                    Add Tag
                  </Button>
                </Stack>

                {/* Display existing tags */}
                {value.customTags && Object.keys(value.customTags).length > 0 && (
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {Object.entries(value.customTags).map(([key, val]) => {
                      if (key === 'level') return null // Skip log levels from display
                      return (
                        <Chip
                          key={key}
                          label={`${key}: ${Array.isArray(val) ? val.join(', ') : val}`}
                          onDelete={() => handleRemoveTag(key)}
                          size="small"
                          variant="outlined"
                          sx={{
                            color: theme => theme.palette.primary.main,
                            borderColor: theme => theme.palette.primary.main,
                            '& .MuiChip-deleteIcon': {
                              color: theme => theme.palette.primary.main,
                              '&:hover': {
                                color: theme => theme.palette.error.main,
                              },
                            },
                          }}
                        />
                      )
                    })}
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Advanced Filters - Mobile modal */}
      <Dialog
        open={showAdvanced && isMobileView}
        onClose={() => setShowAdvanced(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        PaperProps={{
          sx: {
            bgcolor: theme => theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Typography component="span" variant="subtitle1" sx={{ fontWeight: 700 }}>
            Advanced Filters
          </Typography>
          <Button
            variant="text"
            size="small"
            startIcon={<CloseIcon />}
            onClick={() => setShowAdvanced(false)}
            sx={{
              color: theme => theme.palette.text.secondary,
              textTransform: 'none',
              minWidth: 'auto',
              px: 1,
            }}
          >
            Close
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Date Range Section */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Start Time
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={formatDateForInput(value.startTime)}
                  onChange={e => handleDateChange('start', e.target.value)}
                  inputProps={{
                    style: { fontSize: '0.875rem' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme => theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  End Time
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  value={formatDateForInput(value.endTime)}
                  onChange={e => handleDateChange('end', e.target.value)}
                  inputProps={{
                    style: { fontSize: '0.875rem' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme => theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme => theme.palette.divider,
                      },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Log Level Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Log Levels
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    multiple
                    value={selectedLogLevels}
                    onChange={e =>
                      handleLogLevelChange(
                        typeof e.target.value === 'string'
                          ? (e.target.value.split(',').filter(Boolean) as LogLevel[])
                          : (e.target.value as LogLevel[])
                      )
                    }
                    displayEmpty
                    renderValue={selected =>
                      selected.length === 0 ? 'All Levels' : selected.join(', ')
                    }
                    sx={{
                      color: theme => theme.palette.text.primary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme => theme.palette.divider,
                      },
                    }}
                  >
                    {logLevels.map(level => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            {/* Saved Presets */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Quick Presets
                </Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: theme => theme.palette.divider,
                      color: theme => theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme => theme.palette.primary.main,
                        bgcolor: theme => theme.palette.action.hover,
                      },
                    }}
                    onClick={() => {
                      onChange({ ...value, timeRange: '1h', env: ['prod'] })
                      setSelectedLogLevels(['ERROR'])
                    }}
                  >
                    Errors
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: theme => theme.palette.divider,
                      color: theme => theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme => theme.palette.primary.main,
                        bgcolor: theme => theme.palette.action.hover,
                      },
                    }}
                    onClick={() => {
                      onChange({ ...value, timeRange: '24h', env: ['prod', 'staging'] })
                    }}
                  >
                    Last 24h
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {/* Custom Tags Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: theme => theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Custom Tags
                </Typography>

                <Stack direction="row" gap={1} alignItems="flex-start" flexWrap="wrap">
                  <TextField
                    placeholder="key:value"
                    size="small"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const [key, val] = tagInput.split(':')
                        handleAddTag(key.trim(), val?.trim() || '')
                      }
                    }}
                    sx={{
                      width: '200px',
                      '& .MuiOutlinedInput-root': {
                        color: theme => theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: theme => theme.palette.divider,
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      const [key, val] = tagInput.split(':')
                      handleAddTag(key.trim(), val?.trim() || '')
                    }}
                    sx={{
                      textTransform: 'none',
                      mt: 0.5,
                    }}
                  >
                    Add Tag
                  </Button>
                </Stack>

                {value.customTags && Object.keys(value.customTags).length > 0 && (
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {Object.entries(value.customTags).map(([key, val]) => {
                      if (key === 'level') return null
                      return (
                        <Chip
                          key={key}
                          label={`${key}: ${Array.isArray(val) ? val.join(', ') : val}`}
                          onDelete={() => handleRemoveTag(key)}
                          size="small"
                          variant="outlined"
                          sx={{
                            color: theme => theme.palette.primary.main,
                            borderColor: theme => theme.palette.primary.main,
                            '& .MuiChip-deleteIcon': {
                              color: theme => theme.palette.primary.main,
                              '&:hover': {
                                color: theme => theme.palette.error.main,
                              },
                            },
                          }}
                        />
                      )
                    })}
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default GlobalFilterBar
