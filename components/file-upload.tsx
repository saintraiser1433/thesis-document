"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  onUploadComplete?: (fileUrl: string) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export function FileUpload({ 
  onFileSelect, 
  onUploadComplete,
  accept = ".pdf",
  maxSize = 10,
  className = ""
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (accept && !file.name.toLowerCase().endsWith(accept.replace('.', ''))) {
      setErrorMessage(`Please select a ${accept} file`)
      setUploadStatus('error')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setErrorMessage(`File size must be less than ${maxSize}MB`)
      setUploadStatus('error')
      return
    }

    setSelectedFile(file)
    setUploadStatus('idle')
    setErrorMessage("")
    onFileSelect(file)

    // Auto-upload if onUploadComplete is provided
    if (onUploadComplete) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadStatus('idle')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadStatus('success')
        onUploadComplete?.(result.fileUrl)
      } else {
        setUploadStatus('error')
        setErrorMessage(result.error || 'Upload failed')
      }
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setErrorMessage("")
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <Label htmlFor="file" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                Click to upload
              </span>
              <span className="text-sm text-muted-foreground"> or drag and drop</span>
            </Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {accept} files only, max {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      {selectedFile && (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {uploadStatus === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {uploadStatus === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {isUploading && (
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {errorMessage}
            </p>
          )}

          {uploadStatus === 'success' && (
            <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
              File uploaded successfully!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
