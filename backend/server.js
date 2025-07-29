const express = require("express")
const mongoose = require("mongoose")
const multer = require("multer")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")
const cors = require("cors")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500", "file://"],
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.static("public"))

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/document_management"
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

// Document Schema
const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: Number,
  mimeType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
  isPublic: { type: Boolean, default: false },
  tags: [String],
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  versions: [
    {
      version: Number,
      filename: String,
      path: String,
      uploadedAt: Date,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      changes: String,
    },
  ],
})

const User = mongoose.model("User", userSchema)
const Document = mongoose.model("Document", documentSchema)

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    cb(null, true) // Allow all file types
  },
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" })
})

// User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: Boolean(isAdmin),
    })

    await user.save()
    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: error.message })
  }
})

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "24h",
    })

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Upload Document
app.post("/api/documents/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const { title, description, isPublic, tags, changes } = req.body

    // Prevent uploading a document with an existing file name for the same user
    const duplicateDoc = await Document.findOne({
      originalName: req.file.originalname,
      uploadedBy: req.user.userId,
    })

    if (duplicateDoc) {
      // Delete the file that was just stored by multer to keep uploads directory clean
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkErr) {
        console.error("Failed to remove duplicate upload:", unlinkErr)
      }
      return res.status(400).json({
        error: "A file with the same name already exists. Please rename your file and try again.",
      })
    }

    let document
    const existingDoc = await Document.findOne({
      title,
      uploadedBy: req.user.userId,
    })

    if (existingDoc) {
      existingDoc.version += 1
      existingDoc.filename = req.file.filename
      existingDoc.path = req.file.path
      existingDoc.size = req.file.size
      existingDoc.mimeType = req.file.mimetype
      existingDoc.uploadedAt = new Date()

      existingDoc.versions.push({
        version: existingDoc.version,
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date(),
        uploadedBy: req.user.userId,
        changes: changes || `Version ${existingDoc.version}`,
      })

      document = await existingDoc.save()
    } else {
      document = new Document({
        title,
        description,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.userId,
        isPublic: isPublic === "true",
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        versions: [
          {
            version: 1,
            filename: req.file.filename,
            path: req.file.path,
            uploadedAt: new Date(),
            uploadedBy: req.user.userId,
            changes: "Initial upload",
          },
        ],
      })

      await document.save()
    }

    await document.populate([
      { path: "uploadedBy", select: "username" },
      { path: "collaborators", select: "username" },
      { path: "versions.uploadedBy", select: "username" },
    ])

    res.status(201).json(document)
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get Documents
app.get("/api/documents", authenticateToken, async (req, res) => {
  try {
    const { search, filter } = req.query
    let query = {}

    switch (filter) {
      case "public":
        query.isPublic = true
        break
      case "private":
        query = {
          $or: [
            { uploadedBy: req.user.userId, isPublic: false },
            { collaborators: req.user.userId, isPublic: false },
          ],
        }
        break
      case "my-documents":
        query.uploadedBy = req.user.userId
        break
      case "shared":
        query.collaborators = req.user.userId
        break
      default:
        query = {
          $or: [{ isPublic: true }, { uploadedBy: req.user.userId }, { collaborators: req.user.userId }],
        }
    }

    if (search) {
      query.$and = query.$and || []
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ],
      })
    }

    const documents = await Document.find(query)
      .populate("uploadedBy", "username")
      .populate("collaborators", "username")
      .populate("versions.uploadedBy", "username")
      .sort({ uploadedAt: -1 })

    res.json(documents)
  } catch (error) {
    console.error("Get documents error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Delete Document
app.delete("/api/documents/:id", authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    // Only owner or collaborators can delete
    const hasAccess =
      document.uploadedBy.toString() === req.user.userId || document.collaborators.includes(req.user.userId)

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Remove main file and all version files
    const pathsToDelete = [document.path, ...document.versions.map((v) => v.path)]
    pathsToDelete.forEach((p) => {
      if (p && fs.existsSync(p)) {
        try {
          fs.unlinkSync(p)
        } catch (err) {
          console.error("Failed removing file", p, err)
        }
      }
    })

    await Document.deleteOne({ _id: document._id })

    res.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Version History - list versions for a document
app.get("/api/documents/:id/versions", authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate("uploadedBy", "username")
      .populate("versions.uploadedBy", "username")

    if (!document) return res.status(404).json({ error: "Document not found" })

    const hasAccess =
      document.isPublic ||
      document.uploadedBy._id.toString() === req.user.userId ||
      document.collaborators.includes(req.user.userId)

    if (!hasAccess) return res.status(403).json({ error: "Access denied" })

    res.json(document.versions.sort((a, b) => b.version - a.version))
  } catch (error) {
    console.error("Get version history error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Download a specific version
app.get("/api/documents/:id/versions/:version/download", authenticateToken, async (req, res) => {
  try {
    const versionNumber = parseInt(req.params.version, 10)
    const document = await Document.findById(req.params.id)

    if (!document) return res.status(404).json({ error: "Document not found" })

    const hasAccess =
      document.isPublic ||
      document.uploadedBy.toString() === req.user.userId ||
      document.collaborators.includes(req.user.userId)

    if (!hasAccess) return res.status(403).json({ error: "Access denied" })

    const versionEntry = document.versions.find((v) => v.version === versionNumber)
    if (!versionEntry) return res.status(404).json({ error: "Version not found" })

    const filePath = path.resolve(versionEntry.path)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" })

    res.download(filePath, `${path.parse(versionEntry.filename).name}${path.extname(versionEntry.filename)}`)
  } catch (error) {
    console.error("Download version error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Download Document
app.get("/api/documents/:id/download", authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    const hasAccess =
      document.isPublic ||
      document.uploadedBy.toString() === req.user.userId ||
      document.collaborators.includes(req.user.userId)

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" })
    }

    const filePath = path.resolve(document.path)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    res.download(filePath, document.originalName)
  } catch (error) {
    console.error("Download error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// Admin: Get all documents
app.get("/api/admin/documents", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const documents = await Document.find({})
      .populate("uploadedBy", "username")
      .populate("collaborators", "username")
      .populate("versions.uploadedBy", "username")
      .sort({ uploadedAt: -1 })
    res.json(documents)
  } catch (error) {
    console.error("Admin get documents error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Admin: Update document privacy
app.patch("/api/admin/documents/:id/privacy", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isPublic } = req.body
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { isPublic },
      { new: true },
    )
      .populate("uploadedBy", "username")
      .populate("collaborators", "username")
      .populate("versions.uploadedBy", "username")

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    res.json(document)
  } catch (error) {
    console.error("Admin update privacy error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Admin: Delete document
app.delete("/api/admin/documents/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    const pathsToDelete = [document.path, ...document.versions.map((v) => v.path)]
    pathsToDelete.forEach((p) => {
      if (p && fs.existsSync(p)) {
        try {
          fs.unlinkSync(p)
        } catch (err) {
          console.error("Failed removing file", p, err)
        }
      }
    })

    await Document.deleteOne({ _id: document._id })

    res.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Admin delete error:", error)
    res.status(500).json({ error: error.message })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error)
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" })
    }
  }
  res.status(500).json({ error: error.message })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})
