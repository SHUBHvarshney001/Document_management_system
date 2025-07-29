// API Configuration
const API_BASE_URL = "http://localhost:5000/api"

class DocumentManager {
  constructor() {
    this.token = localStorage.getItem("token")
    this.user = JSON.parse(localStorage.getItem("user") || "null")
    this.documents = []
    this.filteredDocuments = []

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.initTheme()

    if (this.token && this.user) {
      this.showMainContent()
      this.loadDocuments()
    } else {
      this.showAuthModal()
    }
  }

  setupEventListeners() {
    // Auth tabs
    document.getElementById("login-tab").addEventListener("click", () => this.switchTab("login"))
    document.getElementById("register-tab").addEventListener("click", () => this.switchTab("register"))

    // Auth forms
    document.getElementById("login-form").addEventListener("submit", (e) => this.handleLogin(e))
    document.getElementById("register-form").addEventListener("submit", (e) => this.handleRegister(e))

    // Logout
    document.getElementById("logout-btn").addEventListener("click", () => this.logout())

    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => this.toggleTheme())

    // Admin dashboard
    const adminBtn = document.getElementById("admin-dashboard-btn")
    adminBtn.addEventListener("click", () => this.openAdminDashboard())
    document.getElementById("close-admin-modal").addEventListener("click", () => this.closeAdminDashboard())

    // Upload form
    document.getElementById("upload-form").addEventListener("submit", (e) => this.handleUpload(e))

    // File drop zone
    const dropZone = document.getElementById("file-drop-zone")
    const fileInput = document.getElementById("file-input")

    dropZone.addEventListener("click", () => fileInput.click())
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault()
      dropZone.classList.add("dragover")
    })
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover")
    })
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault()
      dropZone.classList.remove("dragover")
      const files = e.dataTransfer.files
      if (files.length > 0) {
        fileInput.files = files
        this.showFilePreview(files[0])
      }
    })

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.showFilePreview(e.target.files[0])
      }
    })

    document.getElementById("remove-file").addEventListener("click", () => this.removeFile())

    // Search and filter
    document.getElementById("search-input").addEventListener("input", (e) => this.filterDocuments())
    document.getElementById("filter-select").addEventListener("change", (e) => this.filterDocuments())

    // Version modal
    document.getElementById("close-version-modal").addEventListener("click", () => this.closeVersionModal())
  }

  switchTab(tab) {
    const loginTab = document.getElementById("login-tab")
    const registerTab = document.getElementById("register-tab")
    const loginForm = document.getElementById("login-form")
    const registerForm = document.getElementById("register-form")

    if (tab === "login") {
      loginTab.classList.add("bg-white", "text-blue-600", "shadow-sm")
      loginTab.classList.remove("text-gray-600")
      registerTab.classList.remove("bg-white", "text-blue-600", "shadow-sm")
      registerTab.classList.add("text-gray-600")
      loginForm.classList.remove("hidden")
      registerForm.classList.add("hidden")
    } else {
      registerTab.classList.add("bg-white", "text-blue-600", "shadow-sm")
      registerTab.classList.remove("text-gray-600")
      loginTab.classList.remove("bg-white", "text-blue-600", "shadow-sm")
      loginTab.classList.add("text-gray-600")
      registerForm.classList.remove("hidden")
      loginForm.classList.add("hidden")
    }
  }

  async handleLogin(e) {
    e.preventDefault()
    const username = document.getElementById("login-username").value
    const password = document.getElementById("login-password").value

    this.showLoading()

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        this.token = data.token
        this.user = data.user
        localStorage.setItem("token", this.token)
        localStorage.setItem("user", JSON.stringify(this.user))

        this.hideLoading()
        this.showMainContent()
        this.loadDocuments()
        this.showNotification("Login successful!", "success")
      } else {
        this.hideLoading()
        this.showNotification(data.error, "error")
      }
    } catch (error) {
      this.hideLoading()
      this.showNotification("Login failed. Please check if the server is running.", "error")
      console.error("Login error:", error)
    }
  }

  async handleRegister(e) {
    e.preventDefault()
    const username = document.getElementById("register-username").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value
    const isAdmin = document.getElementById("register-admin").checked

    this.showLoading()

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, isAdmin }),
      })

      const data = await response.json()

      if (response.ok) {
        this.hideLoading()
        this.showNotification("Registration successful! Please login.", "success")
        this.switchTab("login")
        // Clear form
        document.getElementById("register-form").reset()
      } else {
        this.hideLoading()
        this.showNotification(data.error, "error")
      }
    } catch (error) {
      this.hideLoading()
      this.showNotification("Registration failed. Please check if the server is running.", "error")
      console.error("Registration error:", error)
    }
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    this.showAuthModal()
    this.showNotification("Logged out successfully", "success")
  }

  showAuthModal() {
    document.getElementById("auth-modal").classList.remove("hidden")
    document.getElementById("main-content").classList.add("hidden")
    document.getElementById("user-menu").classList.add("hidden")
  }

  showMainContent() {
    // Show/hide admin button
    if (this.user.isAdmin) {
      document.getElementById("admin-dashboard-btn").classList.remove("hidden")
    } else {
      document.getElementById("admin-dashboard-btn").classList.add("hidden")
    }
    document.getElementById("auth-modal").classList.add("hidden")
    document.getElementById("main-content").classList.remove("hidden")
    document.getElementById("user-menu").classList.remove("hidden")
    document.getElementById("username-display").textContent = `Welcome, ${this.user.username}`
  }

  /* ---------------------- Theme ---------------------- */
  toggleTheme() {
    const html = document.documentElement
    const isDark = html.classList.toggle("dark-mode")
    const icon = document.querySelector("#theme-toggle i")
    if (isDark) {
      icon.classList.remove("fa-moon")
      icon.classList.add("fa-sun")
    } else {
      icon.classList.remove("fa-sun")
      icon.classList.add("fa-moon")
    }
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  initTheme() {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.classList.add("dark-mode")
      const icon = document.querySelector("#theme-toggle i")
      icon.classList.remove("fa-moon")
      icon.classList.add("fa-sun")
    }
  }

  /* ---------------------- Admin Dashboard ---------------------- */
  openAdminDashboard() {
    this.loadAllDocuments()
    document.getElementById("admin-modal").classList.remove("hidden")
  }

  closeAdminDashboard() {
    document.getElementById("admin-modal").classList.add("hidden")
  }

  async loadAllDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/documents`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const docs = await response.json()
        this.renderAdminDocuments(docs)
      } else {
        this.showNotification("Failed to load documents", "error")
      }
    } catch (error) {
      console.error("Load admin docs error:", error)
      this.showNotification("Failed to load documents", "error")
    }
  }

  renderAdminDocuments(docs) {
    const grid = document.getElementById("admin-documents-grid")

    grid.innerHTML = docs
      .map(
        (doc) => `
            <div class="bg-white rounded-lg shadow-sm p-6 border hover:ring-2 hover:ring-blue-500 transform hover:-translate-y-1 transition ${doc.isPublic ? 'border-green-400' : 'border-red-400'}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">${doc.title}</h3>
                        <p class="text-gray-600 text-sm line-clamp-2">${doc.description || "No description"}</p>
                    </div>
                    <div class="flex items-center gap-1 ml-2">
                        ${doc.isPublic ? '<i class="fas fa-unlock text-green-600"></i>' : '<i class="fas fa-lock text-red-600"></i>'}
                    </div>
                </div>

                <div class="flex flex-wrap gap-1 mb-4">
                    ${doc.tags.map((tag) => `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">${tag}</span>`).join("")}
                </div>

                <div class="text-sm text-gray-600 space-y-1 mb-4">
                    <div>Size: ${this.formatFileSize(doc.size)}</div>
                    <div>Version: ${doc.version}</div>
                    <div>By: ${doc.uploadedBy.username}</div>
                    <div>Updated: ${this.formatDate(doc.uploadedAt)}</div>
                </div>

                <div class="flex gap-2">
                    <button onclick="documentManager.previewDocument('${doc._id}')" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="documentManager.adminTogglePrivacy('${doc._id}', ${!doc.isPublic})" class="bg-yellow-500 text-white px-3 py-2 rounded-md text-sm hover:bg-yellow-600 transition-colors">
                        ${doc.isPublic ? "Make Private" : "Make Public"}
                    </button>
                    <button onclick="documentManager.adminDeleteDocument('${doc._id}', '${doc.title.replace(/'/g, "\\'")}')" class="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  async adminDeleteDocument(id, title) {
    if (!confirm(`Delete document "${title}"? This action cannot be undone.`)) return
    try {
      const response = await fetch(`${API_BASE_URL}/admin/documents/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        this.showNotification("Document deleted", "success")
        this.loadAllDocuments()
      } else {
        const data = await response.json()
        this.showNotification(data.error || "Delete failed", "error")
      }
    } catch (error) {
      console.error("Admin delete error:", error)
      this.showNotification("Delete failed", "error")
    }
  }

  async adminTogglePrivacy(id, isPublic) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/documents/${id}/privacy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ isPublic }),
      })

      if (response.ok) {
        this.showNotification("Privacy updated", "success")
        this.loadAllDocuments()
      } else {
        const data = await response.json()
        this.showNotification(data.error || "Update failed", "error")
      }
    } catch (error) {
      console.error("Admin privacy error:", error)
      this.showNotification("Update failed", "error")
    }
  }

  /* ---------------------- Document Actions ---------------------- */
  async downloadDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const cd = response.headers.get("Content-Disposition")
        let filename = "document"
        if (cd) {
          const m = cd.match(/filename="(.+)"/)
          if (m) filename = m[1]
        }
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        this.showNotification("Download started", "success")
      } else {
        this.showNotification("Download failed", "error")
      }
    } catch (err) {
      console.error("Download error:", err)
      this.showNotification("Download failed", "error")
    }
  }

  async previewDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, "_blank")
      } else {
        this.showNotification("Preview failed", "error")
      }
    } catch (err) {
      console.error("Preview error:", err)
      this.showNotification("Preview failed", "error")
    }
  }

  /* ---------------------- Existing Methods ---------------------- */

  showFilePreview(file) {
    document.getElementById("file-preview").classList.remove("hidden")
    document.getElementById("file-name").textContent = `${file.name} (${this.formatFileSize(file.size)})`
  }

  removeFile() {
    document.getElementById("file-input").value = ""
    document.getElementById("file-preview").classList.add("hidden")
  }

  async handleUpload(e) {
    e.preventDefault()

    const formData = new FormData()
    const fileInput = document.getElementById("file-input")

    if (!fileInput.files[0]) {
      this.showNotification("Please select a file to upload", "error")
      return
    }

    formData.append("file", fileInput.files[0])
    formData.append("title", document.getElementById("doc-title").value)
    formData.append("description", document.getElementById("doc-description").value)
    formData.append("tags", document.getElementById("doc-tags").value)
    formData.append("isPublic", document.getElementById("is-public").checked)

    this.showLoading()

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        this.hideLoading()
        this.showNotification("Document uploaded successfully!", "success")
        document.getElementById("upload-form").reset()
        this.removeFile()
        this.loadDocuments()
      } else {
        this.hideLoading()
        this.showNotification(data.error, "error")
      }
    } catch (error) {
      this.hideLoading()
      this.showNotification("Upload failed. Please check if the server is running.", "error")
      console.error("Upload error:", error)
    }
  }

  async loadDocuments() {
    const searchTerm = document.getElementById("search-input").value
    const filter = document.getElementById("filter-select").value

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents?search=${encodeURIComponent(searchTerm)}&filter=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      )

      if (response.ok) {
        this.documents = await response.json()
        this.filteredDocuments = this.documents
        this.renderDocuments()
      } else {
        this.showNotification("Failed to load documents", "error")
      }
    } catch (error) {
      this.showNotification("Failed to load documents. Please check if the server is running.", "error")
      console.error("Load documents error:", error)
    }
  }

  filterDocuments() {
    this.loadDocuments()
  }

  renderDocuments() {
    const grid = document.getElementById("documents-grid")
    const emptyState = document.getElementById("empty-state")
    const countElement = document.getElementById("document-count")

    countElement.textContent = `${this.filteredDocuments.length} document${this.filteredDocuments.length !== 1 ? "s" : ""}`

    if (this.filteredDocuments.length === 0) {
      grid.innerHTML = ""
      emptyState.classList.remove("hidden")
      return
    }

    emptyState.classList.add("hidden")

    grid.innerHTML = this.filteredDocuments
      .map(
        (doc) => `
            <div class="document-card bg-white rounded-lg shadow-sm p-6 border">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">${doc.title}</h3>
                        <p class="text-gray-600 text-sm line-clamp-2">${doc.description || "No description"}</p>
                    </div>
                    <div class="flex items-center gap-1 ml-2">
                        ${doc.isPublic ? '<i class="fas fa-unlock text-green-600"></i>' : '<i class="fas fa-lock text-red-600"></i>'}
                        ${doc.collaborators && doc.collaborators.length > 0 ? '<i class="fas fa-users text-blue-600"></i>' : ""}
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-1 mb-4">
                    ${doc.tags.map((tag) => `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">${tag}</span>`).join("")}
                </div>
                
                <div class="text-sm text-gray-600 space-y-1 mb-4">
                    <div>Size: ${this.formatFileSize(doc.size)}</div>
                    <div>Version: ${doc.version}</div>
                    <div>By: ${doc.uploadedBy.username}</div>
                    <div>Updated: ${this.formatDate(doc.uploadedAt)}</div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="documentManager.downloadDocument('${doc._id}')" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
                        <i class="fas fa-download mr-1"></i>
                        Download
                    </button>
                    <button onclick="documentManager.deleteDocument('${doc._id}', '${doc.title.replace(/'/g, "\\'")}')" class="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button onclick="documentManager.showVersionHistory('${doc._id}')" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  async deleteDocument(documentId, title) {
    if (!confirm(`Delete document "${title}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        this.showNotification("Document deleted", "success");
        this.loadDocuments();
      } else {
        const data = await response.json();
        this.showNotification(data.error || "Delete failed", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      this.showNotification("Delete failed", "error");
    }
  }

  async downloadDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers.get("Content-Disposition")
        let filename = "document"
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        this.showNotification("Download started", "success")
      } else {
        this.showNotification("Download failed", "error")
      }
    } catch (error) {
      this.showNotification("Download failed", "error")
      console.error("Download error:", error)
    }
  }

  showVersionHistory(documentId) {
    const doc = this.documents.find((d) => d._id === documentId)
    if (!doc) return

    const versionList = document.getElementById("version-list")
    versionList.innerHTML = doc.versions
      .map(
        (version) => `
            <div class="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <div class="font-medium">Version ${version.version}</div>
                    <div class="text-sm text-gray-600">${version.changes}</div>
                    <div class="text-xs text-gray-500">
                        ${this.formatDate(version.uploadedAt)} by ${version.uploadedBy?.username || doc.uploadedBy?.username || "Unknown"}
                    </div>
                </div>
                <button onclick="documentManager.downloadVersion('${documentId}', ${version.version})" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `,
      )
      .join("")

    document.getElementById("version-modal").classList.remove("hidden")
  }

  async downloadVersion(documentId, version) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/versions/${version}/download`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        const contentDisposition = response.headers.get("Content-Disposition")
        let filename = `document-v${version}`
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        this.showNotification(`Version ${version} download started`, "success")
      } else {
        this.showNotification("Download failed", "error")
      }
    } catch (error) {
      this.showNotification("Download failed", "error")
      console.error("Download version error:", error)
    }
  }

  closeVersionModal() {
    document.getElementById("version-modal").classList.add("hidden")
  }

  showLoading() {
    document.getElementById("loading-overlay").classList.remove("hidden")
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.add("hidden")
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white"
      }`
    notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

// Initialize the application
const documentManager = new DocumentManager()
