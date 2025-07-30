# Document Management System 📁

A secure, collaborative document management system with version control, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

- **Secure Authentication**: JWT-based user authentication and authorization
- **File Upload & Management**: Support for multiple file formats with secure storage
- **Version Control**: Track document versions and changes over time
- **Collaborative Environment**: Multi-user access with role-based permissions
- **Document Search**: Find documents quickly with search functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **RESTful API**: Clean API architecture for easy integration

## 🛠️ Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Multer (File uploads)
- bcryptjs (Password hashing)

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- Responsive Design

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **VS Code** (Recommended) - [Download here](https://code.visualstudio.com/)

### Recommended VS Code Extensions

- Live Server (by Ritwick Dey) - For frontend development
- REST Client (by Huachao Mao) - For API testing
- MongoDB for VS Code - For database management
- Node.js Extension Pack - For Node.js development
- Prettier - Code formatter
- ES6 String HTML - HTML syntax highlighting in JS

## 📁 Project Structure

```
document-management-system/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── uploads/               # File storage (auto-created)
│   └── .env                   # Environment variables
├── frontend/
│   ├── index.html             # Main HTML file
│   ├── app.js                 # Frontend JavaScript
│   ├── style.css              # Styles
│   └── package.json           # Frontend dependencies (optional)
├── scripts/
│   └── mongodb-setup.js       # Database initialization
└── README.md
```

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/SHUBHvarshney001/Document_management_system.git
cd Document_management_system
```

### 2. Backend Setup

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm init -y
npm install express mongoose multer bcryptjs jsonwebtoken cors dotenv
npm install -D nodemon
```

### 3. Frontend Setup (Optional)

If you want to use a local development server:

```bash
cd frontend
npm init -y
npm install -D live-server
```

### 4. Environment Configuration

Create a `.env` file in the backend folder:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_URI=mongodb://localhost:27017/document_management
```

### 5. Database Setup

Start MongoDB service:
- **Windows**: MongoDB should start automatically after installation
- **macOS**: `brew services start mongodb/brew/mongodb-community`
- **Linux**: `sudo systemctl start mongod`

Run the database setup script:

```bash
cd scripts
node mongodb-setup.js
```

## 🚀 Running the Application

### Method 1: VS Code Development Environment

1. **Open VS Code Terminal** (`Ctrl+` ` or `View > Terminal`)
2. **Split Terminal** (Click the split icon or `Ctrl+Shift+5`)

**Terminal 1 - Backend:**
```bash
cd backend
node.server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npx live-server
```

### Method 2: Live Server Extension

1. **Start Backend:**
   ```bash
   cd backend
   node server.js
   ```

2. **Start Frontend:**
   - Right-click on `frontend/land.html`
   - Select "Open with Live Server"

### Method 3: Production Mode

1. **Start Backend:**
   ```bash
   cd backend
   node server.js
   ```

2. **Open Frontend:**
   - Double-click `frontend/land.html`
   - Or drag it to your browser

## 🌐 Access the Application

- **Frontend URL**: [http://localhost:5500](http://localhost:5500) (Live Server) or file://
- **Backend URL**: [http://localhost:5000](http://localhost:5000)

### Default Login Credentials

- **Username**: `admin`
- **Password**: `password`

## 📝 Package.json Scripts

Make sure your `backend/package.json` includes:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
npx kill-port 5000
```

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in .env file

**CORS Issues:**
- Make sure backend CORS is configured
- Frontend and backend should run on different ports

**File Upload Issues:**
- Check if `uploads/` folder exists in backend
- Verify file permissions

### Development Tips

- **Code Changes**: Nodemon will auto-restart backend, Live Server will auto-reload frontend
- **API Testing**: Use REST Client extension or Postman/Insomnia
- **Database Viewing**: Use MongoDB for VS Code extension or MongoDB Compass GUI
