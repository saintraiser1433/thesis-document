"use client"

import { CKEditor } from "@ckeditor/ckeditor5-react"
import ClassicEditor from "@ckeditor/ckeditor5-build-classic"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Base64 upload adapter so images can be pasted/inserted without a server. */
function createBase64UploadAdapter(loader: { file: Promise<File> }) {
  return {
    upload() {
      return loader.file.then(
        (file) =>
          new Promise<{ default: string }>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve({ default: reader.result as string })
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          })
      )
    },
    abort() {},
  }
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="border rounded-md bg-background">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={(_, editor) => {
          const data = editor.getData()
          onChange(data)
        }}
        onReady={(editor) => {
          const fileRepo = editor.plugins.get("FileRepository")
          if (fileRepo) {
            ;(fileRepo as { createUploadAdapter: (loader: { file: Promise<File> }) => unknown }).createUploadAdapter =
              createBase64UploadAdapter
          }
        }}
        config={{
          placeholder: placeholder || "Write your comments...",
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "|",
            "bulletedList",
            "numberedList",
            "|",
            "outdent",
            "indent",
            "|",
            "blockQuote",
            "imageUpload",
            "insertTable",
            "mediaEmbed",
            "|",
            "undo",
            "redo",
          ],
        }}
      />
    </div>
  )
}

