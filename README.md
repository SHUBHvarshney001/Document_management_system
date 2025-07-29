# Document Management System

A secure, collaborative document management system with version control.

## Project Structure

\`\`\`
document-management-system/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── uploads/ (created automatically)
│   └── .env
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── package.json (optional for live server)
├── scripts/
│   └── mongodb-setup.js
└── README.md
\`\`\`

## Prerequisites

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
3. **VS Code** - [Download here](https://code.visualstudio.com/)

## VS Code Extensions (Recommended)

Install these extensions in VS Code:
- **Live Server** (by Ritwick Dey) - For frontend development
- **REST Client** (by Huachao Mao) - For API testing
- **MongoDB for VS Code** - For database management
- **Node.js Extension Pack** - For Node.js development
- **Prettier** - Code formatter
- **ES6 String HTML** - HTML syntax highlighting in JS

## Installation Steps

### 1. Clone/Create Project Structure

Create the following folder structure in your VS Code workspace:

### 2. Backend Setup

Navigate to the backend folder and install dependencies:

\`\`\`bash
cd backend
npm init -y
npm install express mongoose multer bcryptjs jsonwebtoken cors dotenv
npm install -D nodemon
\`\`\`

### 3. Frontend Setup (Optional)

If you want to use a local development server:

\`\`\`bash
cd frontend
npm init -y
npm install -D live-server
\`\`\`

### 4. Database Setup

Start MongoDB service:
- **Windows**: MongoDB should start automatically after installation
- **macOS**: `brew services start mongodb/brew/mongodb-community`
- **Linux**: `sudo systemctl start mongod`

Run the database setup script:

\`\`\`bash
cd scripts
node mongodb-setup.js
\`\`\`

## Running the Application

### Method 1: Using VS Code Terminal (Recommended)

1. **Open VS Code Terminal** (`Ctrl+` ` or `View > Terminal`)

2. **Split Terminal** (Click the split icon or `Ctrl+Shift+5`)

3. **Terminal 1 - Backend**:
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

4. **Terminal 2 - Frontend**:
   \`\`\`bash
   cd frontend
   # If you installed live-server
   npx live-server
   # OR right-click index.html and select "Open with Live Server"
   \`\`\`

### Method 2: Using Live Server Extension

1. **Start Backend**:
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

2. **Start Frontend**:
   - Right-click on `frontend/index.html`
   - Select "Open with Live Server"

### Method 3: Manual File Opening

1. **Start Backend**:
   \`\`\`bash
   cd backend
   npm start
   \`\`\`

2. **Open Frontend**:
   - Double-click `frontend/index.html`
   - Or drag it to your browser

## Environment Variables

Create a `.env` file in the backend folder:

\`\`\`env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_URI=mongodb://localhost:27017/document_management
\`\`\`

## Default Access

- **Frontend URL**: http://localhost:5500 (Live Server) or file://
- **Backend URL**: http://localhost:5000
- **Default Login**: 
  - Username: `admin`
  - Password: `password`

## Troubleshooting

### Common Issues:

1. **Port Already in Use**:
   \`\`\`bash
   # Kill process on port 5000
   npx kill-port 5000
   \`\`\`

2. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check connection string in .env

3. **CORS Issues**:
   - Make sure backend CORS is configured
   - Frontend and backend should run on different ports

4. **File Upload Issues**:
   - Check if `uploads/` folder exists in backend
   - Verify file permissions

## Development Workflow

1. **Code Changes**:
   - Backend: Nodemon will auto-restart
   - Frontend: Live Server will auto-reload

2. **API Testing**:
   - Use REST Client extension
   - Or use Postman/Insomnia

3. **Database Viewing**:
   - Use MongoDB for VS Code extension
   - Or MongoDB Compass GUI

## Package.json Scripts

Backend package.json should include:

\`\`\`json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
\`\`\`

## VS Code Workspace Settings

Create `.vscode/settings.json`:

\`\`\`json
{
  "liveServer.settings.port": 5500,
  "liveServer.settings.root": "/frontend",
  "emmet.includeLanguages": {
    "javascript": "html"
  }
}
