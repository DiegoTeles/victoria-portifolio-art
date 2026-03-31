import type { ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AdminRichTextEditorProps = {
  initialContent: string
  onChange: (html: string) => void
  id?: string
  placeholder?: string
}

export function AdminRichTextEditor({
  initialContent,
  onChange,
  id,
  placeholder,
}: AdminRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-primary underline underline-offset-2',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Escreva aqui…',
      }),
    ],
    content: initialContent?.trim() ? initialContent : '<p></p>',
    editorProps: {
      attributes: {
        class: 'tiptap admin-rich-text-prose min-h-[240px] max-w-none px-3 py-2 focus:outline-none',
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  })

  if (!editor) {
    return (
      <div className="border-input bg-muted/30 min-h-[280px] rounded-md border" aria-hidden />
    )
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL do link', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const ToolBtn = ({
    onClick,
    pressed,
    children,
    label,
  }: {
    onClick: () => void
    pressed?: boolean
    children: ReactNode
    label: string
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-8 w-8 shrink-0 p-0', pressed && 'bg-muted')}
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
    >
      {children}
    </Button>
  )

  return (
    <div className="border-input bg-background overflow-hidden rounded-md border shadow-xs">
      <div
        className="border-border bg-muted/30 flex flex-wrap items-center gap-0.5 border-b p-1.5"
        role="toolbar"
        aria-label="Formatação"
      >
        <ToolBtn
          label="Negrito"
          pressed={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Itálico"
          pressed={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Sublinhado"
          pressed={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="text-xs font-semibold underline">U</span>
        </ToolBtn>
        <div className="bg-border mx-0.5 h-5 w-px" aria-hidden />
        <ToolBtn
          label="Título 2"
          pressed={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Título 3"
          pressed={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </ToolBtn>
        <div className="bg-border mx-0.5 h-5 w-px" aria-hidden />
        <ToolBtn
          label="Lista com marcadores"
          pressed={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Lista numerada"
          pressed={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Citação"
          pressed={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolBtn>
        <ToolBtn label="Linha horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="size-4" />
        </ToolBtn>
        <ToolBtn
          label="Link"
          pressed={editor.isActive('link')}
          onClick={() => setLink()}
        >
          <LinkIcon className="size-4" />
        </ToolBtn>
        <div className="bg-border mx-0.5 h-5 w-px" aria-hidden />
        <ToolBtn label="Anular" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolBtn>
        <ToolBtn label="Refazer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
