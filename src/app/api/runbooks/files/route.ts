import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SaveRunbookBody = {
  fileName?: string
  content?: string
}

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

const parseHeading = (content: string, fileName: string) => {
  const match = content.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() || fileName.replace(/\.(md|markdown)$/i, '')
}

const normalizeLine = (line: string) =>
  line
    .trim()
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .trim()

const parseSections = (content: string): RunbookSection[] => {
  const sectionRegex = /^##\s+(.+)$/gm
  const sections: RunbookSection[] = []
  const matches: Array<{ heading: string; index: number }> = []

  let match: RegExpExecArray | null
  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({ heading: match[1].trim(), index: match.index })
  }

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i]
    const next = matches[i + 1]
    const start = content.indexOf('\n', current.index) + 1
    const end = next ? next.index : content.length
    const body = content.slice(start, end).trim()

    const items = body.split('\n').map(normalizeLine).filter(Boolean)

    sections.push({
      heading: current.heading,
      items,
    })
  }

  return sections
}

export async function GET() {
  const runbooksDir = path.join(process.cwd(), 'public', 'runbooks')

  try {
    const names = await readdir(runbooksDir)
    const markdownFiles = names.filter(name => /\.(md|markdown)$/i.test(name))

    const files = await Promise.all(
      markdownFiles.map(async fileName => {
        const filePath = path.join(runbooksDir, fileName)
        const [content, fileStat] = await Promise.all([readFile(filePath, 'utf-8'), stat(filePath)])

        const title = parseHeading(content, fileName)
        const sections = parseSections(content)

        const item: RunbookFileItem = {
          fileName,
          title,
          updatedAt: fileStat.mtime.toISOString(),
          sections,
        }

        return item
      })
    )

    files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    return Response.json({ files })
  } catch {
    return Response.json({ files: [] })
  }
}

const sanitizeFileName = (raw: string) => {
  const base = raw.trim().replace(/\\/g, '/').split('/').pop() ?? ''
  const normalized = base
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!normalized) {
    return ''
  }

  if (/\.(md|markdown)$/i.test(normalized)) {
    return normalized
  }

  return `${normalized}.md`
}

export async function POST(request: Request) {
  const runbooksDir = path.join(process.cwd(), 'public', 'runbooks')

  try {
    const body = (await request.json()) as SaveRunbookBody
    const fileName = sanitizeFileName(body.fileName ?? '')
    const content = typeof body.content === 'string' ? body.content : ''

    if (!fileName) {
      return Response.json({ ok: false, message: 'Invalid file name.' }, { status: 400 })
    }

    if (!content.trim()) {
      return Response.json({ ok: false, message: 'Markdown content is required.' }, { status: 400 })
    }

    await mkdir(runbooksDir, { recursive: true })
    const targetPath = path.join(runbooksDir, fileName)
    await writeFile(targetPath, content, 'utf-8')

    return Response.json({ ok: true, fileName })
  } catch {
    return Response.json({ ok: false, message: 'Failed to save runbook file.' }, { status: 500 })
  }
}
