'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import NoDataState from '@/components/common/NoDataState'
import { formatDateTime } from '@/lib/formatters'

type RunbookSection = {
  heading: string
  items: string[]
}

type RunbookFileItem = {
  fileName: string
  title: string
  updatedAt: string
  sections: RunbookSection[]
}

type RunbookFilesResponse = {
  files: RunbookFileItem[]
}

export default function RunbooksPage() {
  const [query, setQuery] = useState('')
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('new-runbook.md')
  const [newFileContent, setNewFileContent] = useState(
    `# Runbook: New Incident Guide\n\n## Summary\nDescribe when this runbook should be used.\n\n## Symptoms\n- Symptom 1\n- Symptom 2\n\n## Steps\n1. Step one\n2. Step two\n\n## Escalation\n- Who to call and when\n`
  )
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const { data, isLoading, isFetched, refetch, isRefetching } = useQuery<RunbookFilesResponse>({
    queryKey: ['runbook-markdown-files'],
    queryFn: async () => {
      const response = await fetch('/api/runbooks/files')
      if (!response.ok) {
        return { files: [] }
      }
      return (await response.json()) as RunbookFilesResponse
    },
  })

  const files = data?.files ?? []

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return files

    return files.filter(file => {
      const searchable = [
        file.fileName,
        file.title,
        ...file.sections.map(section => section.heading),
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalized)
    })
  }, [files, query])

  useEffect(() => {
    if (filteredFiles.length === 0) {
      setSelectedFileName(null)
      return
    }

    const hasSelection =
      selectedFileName && filteredFiles.some(item => item.fileName === selectedFileName)
    if (!hasSelection) {
      setSelectedFileName(filteredFiles[0].fileName)
    }
  }, [filteredFiles, selectedFileName])

  const selectedFile = useMemo(
    () => filteredFiles.find(file => file.fileName === selectedFileName) ?? null,
    [filteredFiles, selectedFileName]
  )

  const saveMarkdownFile = async (fileName: string, content: string) => {
    const response = await fetch('/api/runbooks/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content }),
    })

    const payload = (await response.json()) as { ok?: boolean; fileName?: string; message?: string }

    if (!response.ok || !payload.ok || !payload.fileName) {
      throw new Error(payload.message ?? 'Failed to save file')
    }

    await refetch()
    setSelectedFileName(payload.fileName)
    return payload.fileName
  }

  const handleUploadClick = () => {
    uploadInputRef.current?.click()
  }

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const savedFile = await saveMarkdownFile(file.name, content)
      setNotice(`Uploaded and saved: ${savedFile}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload markdown file.'
      setNotice(message)
    } finally {
      if (uploadInputRef.current) {
        uploadInputRef.current.value = ''
      }
    }
  }

  const handleSaveFromEditor = async () => {
    if (!newFileName.trim()) {
      setNotice('File name is required.')
      return
    }

    if (!newFileContent.trim()) {
      setNotice('Markdown content is required.')
      return
    }

    try {
      const savedFile = await saveMarkdownFile(newFileName, newFileContent)
      setEditorOpen(false)
      setNotice(`Saved markdown file: ${savedFile}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save markdown file.'
      setNotice(message)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        gap={1.25}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Runbooks
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage markdown runbook files and inspect section-level content.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <Button variant="outlined" onClick={handleUploadClick} sx={{ textTransform: 'none' }}>
            Upload Markdown File
          </Button>
          <Button
            variant="contained"
            onClick={() => setEditorOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Save from Text
          </Button>
          <Button
            variant="outlined"
            onClick={() => refetch()}
            sx={{ textTransform: 'none' }}
            disabled={isRefetching}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh File List'}
          </Button>
        </Stack>
      </Stack>

      <input
        ref={uploadInputRef}
        type="file"
        accept="text/markdown,.md,.markdown"
        style={{ display: 'none' }}
        onChange={handleUploadFile}
      />

      {notice ? (
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}

      <Card variant="outlined" sx={{ borderColor: 'divider' }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search files or section names"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <Stack gap={1.25}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`runbook-file-skeleton-${index}`} variant="rounded" height={120} />
          ))}
        </Stack>
      ) : isFetched && files.length === 0 ? (
        <NoDataState
          title="No markdown runbooks"
          description="Place markdown files in public/runbooks to manage them here."
        />
      ) : filteredFiles.length === 0 ? (
        <NoDataState title="No matching files" description="No runbook files match your search." />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
            gap: 2,
            minHeight: 540,
          }}
        >
          <Card variant="outlined" sx={{ borderColor: 'divider', minHeight: 0 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Files ({filteredFiles.length})
                </Typography>
              </Box>

              <List sx={{ p: 0, maxHeight: 520, overflowY: 'auto' }}>
                {filteredFiles.map(file => (
                  <Box key={file.fileName}>
                    <ListItemButton
                      selected={selectedFileName === file.fileName}
                      onClick={() => setSelectedFileName(file.fileName)}
                      sx={{ alignItems: 'flex-start', py: 1.25, px: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {file.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.4 }}
                            >
                              {file.fileName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              Updated: {formatDateTime(file.updatedAt)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderColor: 'divider', minHeight: 0 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>
              {selectedFile ? (
                <>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedFile.title}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                      <Chip label={selectedFile.fileName} size="small" variant="outlined" />
                      <Chip
                        label={`Sections: ${selectedFile.sections.length}`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  <Divider />

                  <Box sx={{ overflowY: 'auto', pr: 0.5, minHeight: 0 }}>
                    <Stack gap={1.25}>
                      {selectedFile.sections.length === 0 ? (
                        <NoDataState
                          title="No sections"
                          description="This markdown file has no '## Section' blocks yet."
                        />
                      ) : (
                        selectedFile.sections.map(section => (
                          <Card
                            key={`${selectedFile.fileName}-${section.heading}`}
                            variant="outlined"
                            sx={{ borderColor: 'divider' }}
                          >
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                {section.heading}
                              </Typography>

                              {section.items.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  No list items in this section.
                                </Typography>
                              ) : (
                                <Stack component="ol" sx={{ m: 0, pl: 2.5 }} spacing={0.45}>
                                  {section.items.map((item, index) => (
                                    <Typography
                                      key={`${section.heading}-${index}`}
                                      component="li"
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Stack>
                  </Box>
                </>
              ) : (
                <NoDataState
                  title="No file selected"
                  description="Select a runbook file from the left panel."
                />
              )}
            </CardContent>
          </Card>

          <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth="md">
            <DialogTitle>Save Runbook Markdown</DialogTitle>
            <DialogContent>
              <Stack gap={1.25} sx={{ mt: 0.5 }}>
                <TextField
                  label="File Name"
                  size="small"
                  value={newFileName}
                  onChange={event => setNewFileName(event.target.value)}
                  placeholder="example: payment_failure.md"
                />
                <TextField
                  label="Markdown Content"
                  multiline
                  minRows={14}
                  value={newFileContent}
                  onChange={event => setNewFileContent(event.target.value)}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditorOpen(false)} sx={{ textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveFromEditor}
                variant="contained"
                sx={{ textTransform: 'none' }}
              >
                Save File
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  )
}
