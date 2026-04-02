// [런북 기능 추가] 런북 리스트 테이블 — runbook-service /v1/runbooks/ API 응답 표시
'use client'

import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { Visibility as ViewIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Link from 'next/link'
import { formatDateTime } from '@/lib/formatters'

type RunbookItem = {
  runbook_id: string
  filename: string
  title: string
  updated_at: string
  tags?: string[]
}

type RunbookListProps = {
  data: RunbookItem[]
  onDelete: (runbookId: string, title: string) => void
}

export default function RunbookList({ data, onDelete }: RunbookListProps) {
  if (data.length === 0) return null

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Filename</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tags</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.runbook_id} hover sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{item.filename}</Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {(item.tags ?? []).map(tag => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                  {(!item.tags || item.tags.length === 0) && (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(item.updated_at)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="View">
                    <IconButton size="small" component={Link} href={`/runbooks/${item.runbook_id}`}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(item.runbook_id, item.title)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
