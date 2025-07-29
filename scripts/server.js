const express = require("express")
const mongoose = require("mongoose")
const multer = require("multer")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/document_management", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
    const uploadDir = "uploads/"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
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
    // Allow all file types for document management
    cb(null, true)
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

// User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    })

    await user.save()

    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "24h",
    })

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
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

    // Check if this is a new version of an existing document
    let document
    const existingDoc = await Document.findOne({
      title,
      uploadedBy: req.user.userId,
    })

    if (existingDoc) {
      // Update existing document with new version
      existingDoc.version += 1
      existingDoc.filename = req.file.filename
      existingDoc.path = req.file.path
      existingDoc.size = req.file.size
      existingDoc.mimeType = req.file.mimetype
      existingDoc.uploadedAt = new Date()

      // Add to version history
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
      // Create new document
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

    // Populate user information
    await document.populate("uploadedBy", "username")
    await document.populate("collaborators", "username")

    res.status(201).json(document)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get Documents
app.get("/api/documents", authenticateToken, async (req, res) => {
  try {
    const { search, filter } = req.query
    let query = {}

    // Apply filters
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
        // Show public documents and user's own documents and shared documents
        query = {
          $or: [{ isPublic: true }, { uploadedBy: req.user.userId }, { collaborators: req.user.userId }],
        }
    }

    // Apply search
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
      .sort({ uploadedAt: -1 })

    res.json(documents)
  } catch (error) {
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

    // Check access permissions
    const hasAccess =
      document.isPublic ||
      document.uploadedBy.toString() === req.user.userId ||
      document.collaborators.includes(req.user.userId)

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" })
    }

    const filePath = path.join(__dirname, document.path)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    res.download(filePath, document.originalName)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Download Specific Version
app.get("/api/documents/:id/versions/:version/download", authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    // Check access permissions
    const hasAccess =
      document.isPublic ||
      document.uploadedBy.toString() === req.user.userId ||
      document.collaborators.includes(req.user.userId)

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" })
    }

    const version = document.versions.find((v) => v.version === Number.parseInt(req.params.version))
    if (!version) {
      return res.status(404).json({ error: "Version not found" })
    }

    const filePath = path.join(__dirname, version.path)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    res.download(filePath, `${document.originalName} (v${version.version})`)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add Collaborator
app.post("/api/documents/:id/collaborators", authenticateToken, async (req, res) => {
  try {
    const { username } = req.body
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    // Check if user is the owner
    if (document.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Only document owner can add collaborators" })
    }

    // Find user to add as collaborator
    const collaborator = await User.findOne({ username })
    if (!collaborator) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check if already a collaborator
    if (document.collaborators.includes(collaborator._id)) {
      return res.status(400).json({ error: "User is already a collaborator" })
    }

    document.collaborators.push(collaborator._id)
    await document.save()

    await document.populate("collaborators", "username")
    res.json(document)
  } catch (error) {
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

    // Check if user is the owner
    if (document.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Only document owner can delete" })
    }

    // Delete all version files
    document.versions.forEach((version) => {
      const filePath = path.join(__dirname, version.path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })

    await Document.findByIdAndDelete(req.params.id)
    res.json({ message: "Document deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" })
    }
  }
  res.status(500).json({ error: error.message })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
