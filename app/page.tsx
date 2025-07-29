"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Download, FileText, Users, Lock, Unlock, History, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Document {
  _id: string
  title: string
  description: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  version: number
  isPublic: boolean
  tags: string[]
  versions: DocumentVersion[]
  collaborators: string[]
}

interface DocumentVersion {
  version: number
  filename: string
  uploadedAt: string
  uploadedBy: string
  changes: string
}

interface User {
  _id: string
  username: string
  email: string
}

export default function DocumentManagementSystem() {
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" })
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    isPublic: false,
    tags: "",
    file: null as File | null,
  })
  const { toast } = useToast()

  // Mock data for demonstration
  useEffect(() => {
    const mockUser = {
      _id: "1",
      username: "john_doe",
      email: "john@example.com",
    }
    setUser(mockUser)

    const mockDocuments: Document[] = [
      {
        _id: "1",
        title: "Project Proposal",
        description: "Initial project proposal document",
        filename: "project-proposal-v2.pdf",
        originalName: "Project Proposal.pdf",
        size: 2048576,
        mimeType: "application/pdf",
        uploadedBy: "john_doe",
        uploadedAt: "2024-01-15T10:30:00Z",
        version: 2,
        isPublic: false,
        tags: ["project", "proposal", "business"],
        collaborators: ["jane_smith", "bob_wilson"],
        versions: [
          {
            version: 1,
            filename: "project-proposal-v1.pdf",
            uploadedAt: "2024-01-10T09:15:00Z",
            uploadedBy: "john_doe",
            changes: "Initial version",
          },
          {
            version: 2,
            filename: "project-proposal-v2.pdf",
            uploadedAt: "2024-01-15T10:30:00Z",
            uploadedBy: "john_doe",
            changes: "Updated budget section and timeline",
          },
        ],
      },
      {
        _id: "2",
        title: "Technical Specifications",
        description: "System architecture and technical requirements",
        filename: "tech-specs-v1.docx",
        originalName: "Technical Specifications.docx",
        size: 1536000,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedBy: "jane_smith",
        uploadedAt: "2024-01-20T14:45:00Z",
        version: 1,
        isPublic: true,
        tags: ["technical", "architecture", "requirements"],
        collaborators: ["john_doe"],
        versions: [
          {
            version: 1,
            filename: "tech-specs-v1.docx",
            uploadedAt: "2024-01-20T14:45:00Z",
            uploadedBy: "jane_smith",
            changes: "Initial technical specifications",
          },
        ],
      },
      {
        _id: "3",
        title: "Meeting Notes",
        description: "Weekly team meeting notes",
        filename: "meeting-notes-v3.txt",
        originalName: "Meeting Notes.txt",
        size: 8192,
        mimeType: "text/plain",
        uploadedBy: "bob_wilson",
        uploadedAt: "2024-01-25T16:20:00Z",
        version: 3,
        isPublic: true,
        tags: ["meeting", "notes", "team"],
        collaborators: ["john_doe", "jane_smith"],
        versions: [
          {
            version: 1,
            filename: "meeting-notes-v1.txt",
            uploadedAt: "2024-01-11T16:00:00Z",
            uploadedBy: "bob_wilson",
            changes: "Week 1 meeting notes",
          },
          {
            version: 2,
            filename: "meeting-notes-v2.txt",
            uploadedAt: "2024-01-18T16:10:00Z",
            uploadedBy: "bob_wilson",
            changes: "Week 2 meeting notes",
          },
          {
            version: 3,
            filename: "meeting-notes-v3.txt",
            uploadedAt: "2024-01-25T16:20:00Z",
            uploadedBy: "bob_wilson",
            changes: "Week 3 meeting notes",
          },
        ],
      },
    ]
    setDocuments(mockDocuments)
    setFilteredDocuments(mockDocuments)
  }, [])

  // Filter and search documents
  useEffect(() => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter((doc) => {
        switch (filterType) {
          case "public":
            return doc.isPublic
          case "private":
            return !doc.isPublic
          case "my-documents":
            return doc.uploadedBy === user?.username
          case "shared":
            return doc.collaborators.includes(user?.username || "")
          default:
            return true
        }
      })
    }

    setFilteredDocuments(filtered)
  }, [documents, searchTerm, filterType, user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Mock login
    setTimeout(() => {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Mock registration
    setTimeout(() => {
      toast({
        title: "Registration Successful",
        description: "Account created successfully!",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Mock upload
    setTimeout(() => {
      const newDocument: Document = {
        _id: Date.now().toString(),
        title: uploadForm.title,
        description: uploadForm.description,
        filename: uploadForm.file!.name,
        originalName: uploadForm.file!.name,
        size: uploadForm.file!.size,
        mimeType: uploadForm.file!.type,
        uploadedBy: user?.username || "",
        uploadedAt: new Date().toISOString(),
        version: 1,
        isPublic: uploadForm.isPublic,
        tags: uploadForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        collaborators: [],
        versions: [
          {
            version: 1,
            filename: uploadForm.file!.name,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user?.username || "",
            changes: "Initial upload",
          },
        ],
      }

      setDocuments((prev) => [newDocument, ...prev])
      setUploadForm({ title: "", description: "", isPublic: false, tags: "", file: null })

      toast({
        title: "Upload Successful",
        description: "Document uploaded successfully!",
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleDownload = (document: Document) => {
    toast({
      title: "Download Started",
      description: `Downloading ${document.originalName}...`,
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Document Management System</CardTitle>
            <CardDescription>Secure, collaborative document handling</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Document Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.username}</span>
              <Button variant="outline" size="sm" onClick={() => setUser(null)}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Upload Document */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="project, important, draft"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={uploadForm.isPublic}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="isPublic" className="text-sm">
                      Make public
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Uploading..." : "Upload Document"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter">Filter by</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Documents</SelectItem>
                        <SelectItem value="my-documents">My Documents</SelectItem>
                        <SelectItem value="shared">Shared with Me</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
                <Badge variant="secondary">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Documents Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((document) => (
                  <Card key={document._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{document.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">{document.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {document.isPublic ? (
                            <Unlock className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-600" />
                          )}
                          {document.collaborators.length > 0 && <Users className="h-4 w-4 text-blue-600" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Size: {formatFileSize(document.size)}</div>
                          <div>Version: {document.version}</div>
                          <div>By: {document.uploadedBy}</div>
                          <div>Updated: {formatDate(document.uploadedAt)}</div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleDownload(document)} className="flex-1">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <History className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Version History - {document.title}</DialogTitle>
                                <DialogDescription>View all versions of this document</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 max-h-96 overflow-y-auto">
                                {document.versions.map((version) => (
                                  <div
                                    key={version.version}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                  >
                                    <div>
                                      <div className="font-medium">Version {version.version}</div>
                                      <div className="text-sm text-gray-600">{version.changes}</div>
                                      <div className="text-xs text-gray-500">
                                        {formatDate(version.uploadedAt)} by {version.uploadedBy}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterType !== "all"
                      ? "Try adjusting your search or filters"
                      : "Upload your first document to get started"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
