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
      const response = await fetch("/api/login", {
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
      this.showNotification("Login failed. Please try again.", "error")
    }
  }

  async handleRegister(e) {
    e.preventDefault()
    const username = document.getElementById("register-username").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value

    this.showLoading()

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        this.hideLoading()
        this.showNotification("Registration successful! Please login.", "success")
        this.switchTab("login")
      } else {
        this.hideLoading()
        this.showNotification(data.error, "error")
      }
    } catch (error) {
      this.hideLoading()
      this.showNotification("Registration failed. Please try again.", "error")
    }
  }

  logout() {
    this.token = null
    this.user = null
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    this.showAuthModal()
  }

  showAuthModal() {
    document.getElementById("auth-modal").classList.remove("hidden")
    document.getElementById("main-content").classList.add("hidden")
    document.getElementById("user-menu").classList.add("hidden")
  }

  showMainContent() {
    document.getElementById("auth-modal").classList.add("hidden")
    document.getElementById("main-content").classList.remove("hidden")
    document.getElementById("user-menu").classList.remove("hidden")
    document.getElementById("username-display").textContent = `Welcome, ${this.user.username}`
  }

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
      const response = await fetch("/api/documents/upload", {
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
      this.showNotification("Upload failed. Please try again.", "error")
    }
  }

  async loadDocuments() {
    const searchTerm = document.getElementById("search-input").value
    const filter = document.getElementById("filter-select").value

    try {
      const response = await fetch(`/api/documents?search=${encodeURIComponent(searchTerm)}&filter=${filter}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        this.documents = await response.json()
        this.filteredDocuments = this.documents
        this.renderDocuments()
      } else {
        this.showNotification("Failed to load documents", "error")
      }
    } catch (error) {
      this.showNotification("Failed to load documents", "error")
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
                        ${doc.collaborators.length > 0 ? '<i class="fas fa-users text-blue-600"></i>' : ""}
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
                    <button onclick="documentManager.showVersionHistory('${doc._id}')" class="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  async downloadDocument(documentId) {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = response.headers.get("Content-Disposition")?.split("filename=")[1] || "document"
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
    }
  }

  showVersionHistory(documentId) {
    const document = this.documents.find((doc) => doc._id === documentId)
    if (!document) return

    const versionList = document.getElementById("version-list")
    versionList.innerHTML = document.versions
      .map(
        (version) => `
            <div class="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <div class="font-medium">Version ${version.version}</div>
                    <div class="text-sm text-gray-600">${version.changes}</div>
                    <div class="text-xs text-gray-500">
                        ${this.formatDate(version.uploadedAt)} by ${version.uploadedBy.username || "Unknown"}
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
      const response = await fetch(`/api/documents/${documentId}/versions/${version}/download`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = response.headers.get("Content-Disposition")?.split("filename=")[1] || `document-v${version}`
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
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === "success"
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

    // Auto remove after 5 seconds
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
