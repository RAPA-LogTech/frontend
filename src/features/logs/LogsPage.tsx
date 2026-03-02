'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Chip,
  Drawer,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { apiClient } from '@/lib/apiClient';
import LogsTable from '@/components/tables/LogsTable';
import { LogEntry } from '@/lib/types';

export default function LogsPage() {
  const { data: logs = [] } = useQuery({ queryKey: ['logs'], queryFn: apiClient.getLogs });
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return logs;
    return logs.filter((log) =>
      `${log.service} ${log.message} ${log.level}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [logs, query]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Logs
      </Typography>

      <Card sx={{ bgcolor: '#0f172a', border: '1px solid #1E293B' }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search logs - service:error OR message:timeout"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
              sx={{
                bgcolor: '#1e293b',
                '& .MuiOutlinedInput-root': {
                  color: '#cbd5e1',
                  '& fieldset': {
                    borderColor: '#334155',
                  },
                  '&:hover fieldset': {
                    borderColor: '#475569',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#c084fc',
                  },
                },
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="env:prod" variant="outlined" size="small" />
              <Chip label="service:checkout" variant="outlined" size="small" />
              <Chip label="level:error" variant="outlined" size="small" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <LogsTable logs={filtered} onSelect={setSelectedLog} />

      {/* Selected Log Detail Drawer */}
      <Drawer
        anchor="right"
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        PaperProps={{
          sx: {
            width: 384,
            bgcolor: '#0f172a',
            borderLeft: '1px solid #1E293B',
          },
        }}
      >
        {selectedLog && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Log Detail
              </Typography>
              <IconButton
                onClick={() => setSelectedLog(null)}
                size="small"
                sx={{ color: '#64748b' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: '#64748b' }}>
              ID: {selectedLog.id}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Timestamp: {selectedLog.timestamp}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Service: {selectedLog.service}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Level: {selectedLog.level}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Message: {selectedLog.message}
            </Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
