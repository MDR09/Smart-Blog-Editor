# 🚀 Smart Blog Editor

A modern, feature-rich blog editor built with React, FastAPI, and MongoDB. Features real-time auto-save, rich text editing with Lexical, and AI-powered content enhancement using Google Gemini.

![Smart Blog Editor](https://img.shields.io/badge/React-18.3-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen) ![Lexical](https://img.shields.io/badge/Lexical-0.19-orange)

## ✨ Features

- 📝 **Rich Text Editor** - Powered by Lexical with support for:
  - Bold, Italic, Underline, Strikethrough
  - Headings (H1, H2, H3)
  - Bullet and Numbered Lists
  - Real-time formatting
  
- 💾 **Smart Auto-Save** - Intelligent auto-save system that:
  - Saves changes automatically after 2 seconds of inactivity
  - Only saves when content is actually modified
  - Prevents unnecessary API calls
  - Handles post switching gracefully
  
- 🤖 **AI-Powered Enhancement** - Google Gemini integration for:
  - Content improvement suggestions
  - Grammar and style corrections
  - SEO optimization
  
- 🔐 **Authentication** - Secure JWT-based authentication
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Modern UI** - Clean, intuitive interface with Tailwind CSS
- ⚡ **Real-time Updates** - Instant feedback with dynamic timestamps

---

## 📋 Table of Contents

- [Setup Instructions](#-setup-instructions)
- [Auto-Save Logic Explanation](#-auto-save-logic-explanation)
- [Database Schema Design](#-database-schema-design)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Technologies Used](#-technologies-used)

---

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **MongoDB Atlas** account (free tier works)
- **Google Gemini API Key** (free at https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-blog-editor.git
cd smart-blog-editor
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Configure `backend/.env`:**

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster0.mongodb.net/?appName=Cluster0
DATABASE_NAME=smart_blog_editor

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Environment
ENVIRONMENT=development
```

**Start the backend server:**

```bash
uvicorn app.main:app --reload --port 8000
```

Backend will run at: `http://localhost:8000`  
API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Configure `frontend/.env`:**

```env
VITE_API_URL=http://localhost:8000
```

**Start the development server:**

```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

### 4. Create Your First User

1. Open `http://localhost:5173`
2. Click "Register" and create an account
3. Login with your credentials
4. Start creating blog posts!

---

## 💡 Auto-Save Logic Explanation

The auto-save system is designed to provide a seamless writing experience while minimizing unnecessary API calls and preventing data conflicts.

### Architecture Overview

```
User Types → Editor Detects Change → Debounced Function (2s) → Auto-Save API Call
                                    ↓
                            Post Switch Detected → Cancel Pending Save
```

### Key Components

#### 1. **AutoSavePlugin** (`frontend/src/components/Editor/plugins/AutoSavePlugin.jsx`)

The core auto-save logic lives in a Lexical plugin that:

```javascript
// Stable debounced function using useRef
const debouncedSaveRef = useRef(
  debounce(() => {
    if (!postIdRef.current) return;
    
    const editor = editorRef.current;
    editor.getEditorState().read(() => {
      const jsonState = editor.getEditorState().toJSON();
      onContentChangeRef.current(jsonState);
    });
  }, 2000) // 2 second delay
);
```

**Why this approach?**
- ✅ **useRef** prevents function recreation on re-renders
- ✅ **Refs for props** ensure we always access latest values
- ✅ **2-second debounce** balances responsiveness vs. API load
- ✅ **EditorState JSON** preserves all formatting and structure

#### 2. **useAutoSave Hook** (`frontend/src/hooks/useAutoSave.js`)

Manages the auto-save state and API communication:

```javascript
const debouncedSave = useMemo(
  () =>
    debounce(async (contentToSave) => {
      if (!postId || !contentModified) return;
      
      // PostId validation prevents saving wrong content
      if (currentPost?.postId !== postId) {
        console.warn('⚠️ PostId mismatch detected!');
        return;
      }
      
      await apiWithAuth.put(`/api/posts/${postId}`, {
        content: contentToSave,
        title: currentPost?.title || 'Untitled'
      });
    }, 2000),
  [postId, contentModified]
);
```

**Key Features:**

1. **Content Modified Flag** (`contentModified`)
   - Set to `false` on page load/post switch
   - Set to `true` when user types
   - Prevents auto-save on initial render

2. **PostId Validation**
   - Checks if the content belongs to the current post
   - Prevents saving Post A's content to Post B
   - Critical for multi-post navigation

3. **Debounce Cleanup**
   - Cancels pending saves when switching posts
   - Prevents race conditions
   - Ensures data integrity

#### 3. **Post Switching Logic**

```javascript
useEffect(() => {
  // Cancel any pending auto-save when switching posts
  return () => {
    debouncedSave.cancel();
  };
}, [postId]);
```

**Why this matters:**
- User types in Post A
- Clicks Post B before auto-save fires
- Without cleanup: Post A content saves to Post B ❌
- With cleanup: Pending save is cancelled ✅

### Auto-Save Flow Example

```
1. User opens Post A (ID: 123)
   → contentModified = false
   → No auto-save triggered

2. User types "Hello World"
   → contentModified = true
   → Debounced function starts (2s timer)

3. User continues typing "Hello World!"
   → Timer resets (another 2s)

4. User stops typing
   → After 2s: Auto-save triggers
   → API call: PUT /api/posts/123 with content

5. User clicks Post B (ID: 456)
   → debouncedSave.cancel() called
   → contentModified = false (for Post B)
   → Post B loads, no auto-save
```

### Why 2 Seconds?

- **Too short (< 1s)**: Too many API calls, poor performance
- **Too long (> 5s)**: Risk of data loss if browser crashes
- **2 seconds**: Sweet spot for UX and performance

### Edge Cases Handled

1. ✅ **Rapid post switching** - Cancels pending saves
2. ✅ **Browser refresh** - Only saves if contentModified=true
3. ✅ **Concurrent edits** - Last save wins (no conflict resolution needed for single-user editor)
4. ✅ **Network failures** - Graceful error handling with user notification
5. ✅ **Empty content** - Validates content before saving

---

## 🗄️ Database Schema Design

### Why MongoDB?

MongoDB was chosen for this project because:

1. **Flexible Schema** - Blog posts may have varying structures (images, videos, embeds)
2. **JSON-Native** - Lexical editor state is JSON, perfect match
3. **Scalability** - Easy horizontal scaling for future growth
4. **Rich Queries** - Powerful aggregation pipeline for analytics
5. **Atlas Free Tier** - Great for development and small projects

### Schema Design Philosophy

The schema follows these principles:

- ✅ **Denormalization** - Embed related data for faster reads
- ✅ **Indexing** - Strategic indexes for common queries
- ✅ **Referencing** - User ID reference for data integrity
- ✅ **Timestamps** - Track creation and modification times

---

### Collections

#### 1. **Users Collection**

```python
{
  "_id": ObjectId("..."),
  "email": "user@example.com",          # Unique, indexed
  "username": "johndoe",                 # Display name
  "hashed_password": "bcrypt_hash...",   # Secure password storage
  "created_at": ISODate("2024-02-18"),
  "updated_at": ISODate("2024-02-18")
}
```

**Indexes:**
- `email` (unique) - Fast login lookups
- `created_at` (descending) - User analytics

**Why this design?**
- Separate `username` and `email` for flexibility
- `bcrypt` hashing for security (not stored in plain text)
- Timestamps for audit trails

---

#### 2. **Posts Collection**

```python
{
  "_id": ObjectId("..."),
  "title": "My First Blog Post",
  "content": {                           # Lexical EditorState JSON
    "root": {
      "children": [
        {
          "children": [
            {
              "detail": 0,
              "format": 1,               # Bold, italic, etc.
              "mode": "normal",
              "style": "",
              "text": "Hello World",
              "type": "text",
              "version": 1
            }
          ],
          "direction": "ltr",
          "format": "",
          "indent": 0,
          "type": "paragraph",
          "version": 1
        }
      ],
      "direction": "ltr",
      "format": "",
      "indent": 0,
      "type": "root",
      "version": 1
    }
  },
  "status": "draft",                     # draft | published
  "author_id": ObjectId("..."),          # Reference to Users collection
  "created_at": ISODate("2024-02-18"),
  "updated_at": ISODate("2024-02-18")
}
```

**Indexes:**
- `author_id` - Fast queries for "my posts"
- `created_at` (descending) - Chronological ordering
- Compound index: `(author_id, created_at)` - Optimized user timeline

**Why this design?**

1. **Content as JSON** - Stores the entire Lexical EditorState
   - Preserves all formatting (bold, italic, headings)
   - No parsing needed - direct editor restoration
   - Supports future rich content (images, embeds)

2. **Status Field** - Simple workflow management
   - `draft` - Work in progress
   - `published` - Visible to public
   - Easy to extend: `scheduled`, `archived`

3. **Author Reference** - Not embedded for:
   - Users can change email/name without updating all posts
   - Efficient storage (no duplication)
   - Easy user deletion cascade

4. **Timestamps** - Critical for:
   - Sorting posts chronologically
   - Auto-save tracking (updated_at changes on each save)
   - Analytics (post frequency, time to publish)

---

### Alternative Schemas Considered

#### Option A: Separate Content Versions (Rejected)

```python
{
  "post_id": ObjectId("..."),
  "version": 1,
  "content": {...},
  "created_at": ISODate("...")
}
```

**Why rejected:**
- Unnecessary complexity for MVP
- No version history requirement
- Current design can be extended later

#### Option B: Embedded Author Data (Rejected)

```python
{
  "author": {
    "id": ObjectId("..."),
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Why rejected:**
- Data duplication if user updates profile
- Must update all posts on user change
- Referencing is more maintainable

---

### Schema Migration Strategy

If we need to add new fields (e.g., `tags`, `category`):

```python
# New fields with defaults
{
  "tags": [],                    # Empty array default
  "category": "general",         # Default category
  "featured_image": null,        # Optional image URL
  "reading_time": 5,             # Auto-calculated
  "view_count": 0                # Analytics
}
```

MongoDB's flexible schema allows gradual migration without downtime.

---

### Performance Considerations

1. **Index Strategy**
   ```python
   # Single field indexes
   db.users.create_index("email", unique=True)
   db.posts.create_index("author_id")
   
   # Compound index for common queries
   db.posts.create_index([("author_id", 1), ("created_at", -1)])
   ```

2. **Query Patterns**
   ```python
   # Efficient: Uses index
   posts = await db.posts.find({"author_id": user_id}).sort("created_at", -1)
   
   # Inefficient: Full collection scan
   posts = await db.posts.find({"title": {"$regex": "blog"}})
   ```

3. **Content Size Limits**
   - MongoDB document limit: 16MB
   - Typical blog post: < 100KB
   - Room for ~160 posts per document (theoretical)
   - In practice: 1 post = 1 document

---

## 📁 Project Structure

```
smart-blog-editor/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app & CORS
│   │   ├── database.py          # MongoDB connection & indexes
│   │   ├── models.py            # Pydantic schemas
│   │   ├── auth.py              # JWT authentication
│   │   └── routers/
│   │       ├── auth.py          # Login/Register endpoints
│   │       ├── posts.py         # CRUD operations
│   │       └── ai.py            # Gemini AI integration
│   ├── requirements.txt
│   ├── .env
│   └── Procfile                 # Railway deployment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── Editor.jsx
│   │   │   │   ├── Toolbar.jsx
│   │   │   │   └── plugins/
│   │   │   │       └── AutoSavePlugin.jsx
│   │   │   ├── PostList.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── EditorPage.jsx
│   │   ├── hooks/
│   │   │   ├── useAutoSave.js
│   │   │   └── useStore.js      # Zustand state management
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
```json
Request:
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### POST `/api/auth/login`
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Post Endpoints

#### GET `/api/posts`
Get all posts for authenticated user.

```json
Response:
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "My First Post",
    "content": { /* Lexical JSON */ },
    "status": "draft",
    "created_at": "2024-02-18T10:30:00Z",
    "updated_at": "2024-02-18T10:35:00Z"
  }
]
```

#### POST `/api/posts`
Create new post.

```json
Request:
{
  "title": "New Post",
  "content": { /* Lexical JSON */ },
  "status": "draft"
}
```

#### PUT `/api/posts/{post_id}`
Update existing post (auto-save uses this).

```json
Request:
{
  "title": "Updated Title",
  "content": { /* Lexical JSON */ }
}
```

#### DELETE `/api/posts/{post_id}`
Delete a post.

### AI Endpoints

#### POST `/api/ai/enhance`
Enhance content with AI.

```json
Request:
{
  "content": "This is my blog post content..."
}

Response:
{
  "enhanced_content": "This is your enhanced content with improvements..."
}
```

---

## 🚀 Deployment

### Backend (Railway)

1. **Create Railway Account** - https://railway.app

2. **Deploy from GitHub:**
   ```bash
   # Railway will auto-detect Python and install dependencies
   # Ensure Procfile exists in backend/
   ```

3. **Set Environment Variables:**
   ```
   MONGODB_URL=mongodb+srv://...
   DATABASE_NAME=smart_blog_editor
   SECRET_KEY=your-production-secret
   GEMINI_API_KEY=your-api-key
   ```

4. **MongoDB Atlas Setup:**
   - Whitelist Railway IP: `0.0.0.0/0` (or specific IPs)
   - Create database user with read/write permissions

### Frontend (Vercel)

1. **Create Vercel Account** - https://vercel.com

2. **Deploy:**
   ```bash
   npm run build  # Test locally first
   vercel --prod  # Deploy to production
   ```

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Update Backend CORS:**
   ```python
   allow_origins=[
       "https://your-frontend.vercel.app",
       "https://*.vercel.app"
   ]
   ```

---

## 🛠️ Technologies Used

### Frontend
- **React 18.3** - UI framework
- **Vite 6.0** - Build tool & dev server
- **Lexical 0.19** - Rich text editor framework
- **Zustand 5.0** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **date-fns** - Date formatting

### Backend
- **FastAPI 0.115** - Web framework
- **Motor 3.6** - Async MongoDB driver
- **PyMongo 4.10** - MongoDB toolkit
- **Pydantic 2.10** - Data validation
- **python-jose** - JWT tokens
- **passlib** - Password hashing
- **Google Generative AI** - Gemini API client

### Database
- **MongoDB Atlas** - Cloud database
- **Motor** - Async Python driver

### DevOps
- **Railway** - Backend hosting
- **Vercel** - Frontend hosting
- **GitHub** - Version control

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- [Lexical](https://lexical.dev) - Amazing rich text editor
- [FastAPI](https://fastapi.tiangolo.com) - Modern Python web framework
- [MongoDB](https://www.mongodb.com) - Flexible NoSQL database
- [Google Gemini](https://ai.google.dev) - AI enhancement capabilities

---

## 📈 Future Enhancements

- [ ] Real-time collaboration (WebSockets)
- [ ] Image upload & management
- [ ] Version history
- [ ] Export to Markdown/PDF
- [ ] SEO optimization tools
- [ ] Analytics dashboard
- [ ] Tag system
- [ ] Social media integration

---

**Made with ❤️ by MANISH**
