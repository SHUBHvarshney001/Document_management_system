// MongoDB Database Setup Script
// Run this script to set up the database collections and indexes

const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const uri = "mongodb://localhost:27017"
const dbName = "document_management"

async function setupDatabase() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db(dbName)

    // Drop existing collections (for fresh setup)
    try {
      await db.collection("users").drop()
      await db.collection("documents").drop()
      console.log("🗑️  Dropped existing collections")
    } catch (error) {
      console.log("ℹ️  No existing collections to drop")
    }

    // Create collections
    await db.createCollection("users")
    await db.createCollection("documents")
    console.log("📁 Created collections")

    // Create indexes for better performance
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("users").createIndex({ email: 1 }, { unique: true })

    await db.collection("documents").createIndex({ title: "text", description: "text", tags: "text" })
    await db.collection("documents").createIndex({ uploadedBy: 1 })
    await db.collection("documents").createIndex({ uploadedAt: -1 })
    await db.collection("documents").createIndex({ isPublic: 1 })
    await db.collection("documents").createIndex({ collaborators: 1 })
    console.log("🔍 Created database indexes")

    // Insert sample users
    const hashedPassword = await bcrypt.hash("password", 10)

    const sampleUsers = [
      {
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        createdAt: new Date(),
      },
      {
        username: "john_doe",
        email: "john@example.com",
        password: hashedPassword,
        createdAt: new Date(),
      },
      {
        username: "jane_smith",
        email: "jane@example.com",
        password: hashedPassword,
        createdAt: new Date(),
      },
    ]

    await db.collection("users").insertMany(sampleUsers)
    console.log("👥 Created sample users:")
    console.log("   - Username: admin, Password: password")
    console.log("   - Username: john_doe, Password: password")
    console.log("   - Username: jane_smith, Password: password")

    console.log("\n🎉 Database setup completed successfully!")
    console.log("\n📋 Next steps:")
    console.log("1. Start the backend server: cd backend && npm run dev")
    console.log("2. Open the frontend: cd frontend && open index.html")
    console.log("3. Login with username: admin, password: password")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
  } finally {
    await client.close()
  }
}

// Check if MongoDB is available
async function checkMongoDB() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    await client.db("admin").admin().ping()
    console.log("✅ MongoDB is running")
    await client.close()
    return true
  } catch (error) {
    console.error("❌ MongoDB is not running. Please start MongoDB first.")
    console.error("   - Windows: MongoDB should start automatically")
    console.error("   - macOS: brew services start mongodb/brew/mongodb-community")
    console.error("   - Linux: sudo systemctl start mongod")
    return false
  }
}

// Main execution
async function main() {
  console.log("🚀 Setting up Document Management System Database...\n")

  const isMongoRunning = await checkMongoDB()
  if (isMongoRunning) {
    await setupDatabase()
  }
}

main()
