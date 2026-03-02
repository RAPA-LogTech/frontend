'use client';

import React, { useState } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Button,
  Collapse,
  Alert,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { GlobalFilterState, Environment } from '@/lib/types';
import { globalFilterOptions } from '@/lib/mock';

interface GlobalFilterBarProps {
  value: GlobalFilterState;
  onChange: (filters: GlobalFilterState) => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  value,
  onChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTimeRangeChange = (timeRange: string) => {
    onChange({
      ...value,
      timeRange,
    });
  };

  const handleServiceChange = (service: string | string[]) => {
    const selected = Array.isArray(service) ? service : [service];
    onChange({
      ...value,
      service: selected,
    });
  };

  const handleEnvChange = (env: string | string[]) => {
    const selected = Array.isArray(env)
      ? (env as Environment[])
      : ([env] as Environment[]);
    onChange({
      ...value,
      env: selected,
    });
  };

  const handleClusterChange = (cluster: string | string[]) => {
    const selected = Array.isArray(cluster) ? cluster : [cluster];
    onChange({
      ...value,
      cluster: selected,
    });
  };

  const handleReset = () => {
    onChange({
      timeRange: '1h',
      service: [],
      env: ['prod'],
      cluster: [],
    });
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: '56px',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
          borderBottom: '1px solid',
          borderColor: (theme) => theme.palette.divider,
          px: { xs: 1.5, sm: 2, md: 3 },
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
      {/* Compact Grid - no flex grow */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Time Range */}
        <FormControl size="small" sx={{ width: '100%' }}>
          <Select
            value={value.timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            sx={{
              color: (theme) => theme.palette.text.primary,
              fontSize: '0.875rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) => theme.palette.divider,
              },
            }}
          >
            {globalFilterOptions.timeRanges.map((tr) => (
              <MenuItem key={tr.value} value={tr.value}>
                {tr.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Service Filter */}
        <FormControl size="small" sx={{ width: '100%' }}>
          <Select
            multiple
            value={value.service}
            onChange={(e) => handleServiceChange(e.target.value)}
            displayEmpty
            sx={{
              color: (theme) => theme.palette.text.primary,
              fontSize: '0.875rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) => theme.palette.divider,
              },
            }}
          >
            <MenuItem value="">
              <em>All Services</em>
            </MenuItem>
            {globalFilterOptions.services.map((service) => (
              <MenuItem key={service} value={service}>
                {service}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Environment Filter */}
        <FormControl size="small" sx={{ width: '100%' }}>
          <Select
            multiple
            value={value.env}
            onChange={(e) => handleEnvChange(e.target.value)}
            displayEmpty
            sx={{
              color: (theme) => theme.palette.text.primary,
              fontSize: '0.875rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) => theme.palette.divider,
              },
            }}
          >
            <MenuItem value="">
              <em>All Envs</em>
            </MenuItem>
            {globalFilterOptions.envs.map((env) => (
              <MenuItem key={env} value={env}>
                {env}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Cluster Filter */}
        <FormControl size="small" sx={{ width: '100%' }}>
          <Select
            multiple
            value={value.cluster}
            onChange={(e) => handleClusterChange(e.target.value)}
            displayEmpty
            sx={{
              color: (theme) => theme.palette.text.primary,
              fontSize: '0.875rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) => theme.palette.divider,
              },
            }}
          >
            <MenuItem value="">
              <em>All Clusters</em>
            </MenuItem>
            {globalFilterOptions.clusters.map((cluster) => (
              <MenuItem key={cluster} value={cluster}>
                {cluster}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Buttons - no flex grow AFTER filter inputs done */}
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
            bgcolor: (theme) => showAdvanced ? theme.palette.primary.main : 'transparent',
            color: (theme) => showAdvanced ? '#fff' : theme.palette.text.secondary,
            borderColor: (theme) => theme.palette.divider,
            textTransform: 'none',
            '&:hover': {
              bgcolor: (theme) => showAdvanced ? theme.palette.primary.dark : theme.palette.action.hover,
              borderColor: (theme) => theme.palette.primary.main,
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
            color: (theme) => theme.palette.text.secondary,
            borderColor: (theme) => theme.palette.divider,
            textTransform: 'none',
            '&:hover': {
              bgcolor: (theme) => theme.palette.action.hover,
              borderColor: (theme) => theme.palette.primary.main,
            },
          }}
          title="Reset all filters"
        >
          Reset
        </Button>
      </Stack>
    </Box>

    {/* Advanced Filters - Separate section below if needed */}
    {showAdvanced && (
      <Box
        sx={{
          bgcolor: (theme) => theme.palette.background.paper,
          px: { xs: 1.5, sm: 2, md: 3 },
          pb: 2,
          borderBottom: '1px solid',
          borderColor: (theme) => theme.palette.divider,
        }}
      >
        <Alert
          severity="info"
          variant="outlined"
          sx={{
            bgcolor: (theme) => theme.palette.action.hover,
            color: (theme) => theme.palette.text.secondary,
            borderColor: (theme) => theme.palette.divider,
            fontSize: '0.875rem',
          }}
        >
          🔧 Advanced filter UI will be implemented here
          <br />- Custom tag filters
          <br />- Date range picker
          <br />- Saved filter presets
        </Alert>
      </Box>
    )}
    </>
  );
}

export default GlobalFilterBar;
