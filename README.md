# Scrolla - Mindful Social Media Platform

🌟 **Scrolla** is a revolutionary social media platform that solves the cognitive overload problem of traditional social networks. Unlike platforms that bombard users with endless algorithmic content, Scrolla asks users about their **mood, purpose, and available time** before showing them a curated, meaningful feed.

---

## 🎯 Key Features

- **Mood-Based Content Delivery**: Select your emotional state (Calm, Focused, Motivated, Low, Happy, Stressed) and get matching content
- **Purpose-Driven Feed**: Choose your intent (Learn, Relax, Discuss, Inspire, Entertain) for personalized content
- **Time-Constrained Journeys**: Set time limits (5, 10, 20, 30 mins) with clear start and end points - no infinite scrolling
- **Interactive Post Management**: Create posts with text, images, hashtags, and mood selectors
- **Smart Social Features**: Like, comment, share, follow/unfollow with meaningful engagement
- **Advanced Post Interactions**: 
  - Three-dot menu on posts with Save, Hide, Report options
  - Edit and Delete for your own posts
  - Real-time comment sections with user avatars
- **Age-Appropriate Content**: Kids Zone (<13), Teen Zone (13-17), Adult Zone (18+)
- **Responsive Design**: Built with Tailwind CSS for seamless mobile and desktop experience

---

## 🛠️ Tech Stack

### Frontend (Client)
- React 19 with Vite
- React Router for navigation
- Tailwind CSS 3.4 for styling
- Axios for API calls
- date-fns for date formatting
- Lucide React & React Icons for UI icons
- React Share for social sharing

### Backend (Server)
- Node.js with Express 5
-  with Mongoose ODM
- JWT authentication
- bcryptjs for password hashing
- CORS enabled for API access
- Compression middleware for performance

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Scrolla
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure Environment Variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/scrolla
   JWT_SECRET=your_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

   > **Note**: For MongoDB Atlas, replace `MONGODB_URI` with your connection string:
   > ```
   > MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scrolla
   > ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`

3. **Start the Frontend (in a new terminal)**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

4. **Open your browser** and navigate to `http://localhost:5173`

---

## 📱 Usage Flow

1. **Register/Login**: Create an account and select your age zone
2. **Select Mood**: Choose how you're feeling
3. **Choose Purpose**: Pick what you want to do
4. **Set Time**: Decide how long you want to scroll
5. **Enjoy Feed**: Browse curated content based on your selections
6. **Engage**: Like, comment, share posts
7. **Create**: Share your own thoughts with mood and purpose tags
8. **Journey Complete**: Receive feedback when your time is up

---

## 🎨 Design Philosophy

Scrolla is built with a focus on:
- **Mindfulness**: Intentional browsing with clear time boundaries
- **Personalization**: Content matching your current emotional state
- **Safety**: Age-appropriate content filtering
- **Engagement**: Meaningful interactions over endless scrolling
- **Aesthetics**: Modern, beautiful UI with smooth animations

---

## 📂 Project Structure

```
Scrolla/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions and constants
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── server.js         # Server entry point
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get filtered posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like
- `POST /api/posts/:id/save` - Save post
- `POST /api/posts/:id/hide` - Hide post
- `POST /api/posts/:id/report` - Report post

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user

### Comments
- `GET /api/posts/:postId/comments` - Get comments
- `POST /api/posts/:postId/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Journeys
- `POST /api/journeys/start` - Start journey
- `PUT /api/journeys/:id/complete` - Complete journey
- `GET /api/journeys/history` - Get history

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🌟 Future Enhancements

- Push notifications for journey completion
- Advanced analytics dashboard
- AI-powered content recommendations
- Group discussions and communities
- Dark mode toggle
- Progressive Web App (PWA) support
- Mobile native apps (iOS/Android)

---

**Built with ❤️ for mindful social media consumption**











# Image and Video Storing using Multi Data Form

This document outlines the plan to integrate Cloudinary for storage and implement multipart/form-data handling for both images and videos.

## 1. Cloudinary Setup & Configuration

### **Backend Dependencies**
- Install `cloudinary` (v2) and `multer-storage-cloudinary` packages.
- Ensure `multer` is already installed (reuses existing installation).
- Add environment variables to [.env](file:///d:/Capstone/Scrolla/server/.env):
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### **Configuration File (`config/cloudinary.js`)**
- Create a configuration file to initialize the Cloudinary SDK with environment variables.
- Configure `CloudinaryStorage` for Multer:
  - Define folder structure (e.g., `scrolla/posts`).
  - Set allowed formats: `jpg`, `png`, `jpeg`, `mp4`, [mov](file:///d:/Capstone/Scrolla/client/src/components/FileUpload.jsx#57-62).
  - Configure resource types to handle both `image` and `video`.

## 2. Backend Implementation (Express)

### **Update Upload Routes ([routes/uploadRoutes.js](file:///d:/Capstone/Scrolla/server/routes/uploadRoutes.js))**
- Modify the existing upload route to use the Cloudinary storage engine instead of disk storage.
- Create a middleware using Multer to handle `multipart/form-data`.
- Configure the route to accept fields:
  - `files`: Array of files (mixed images and videos).
- In the controller:
  - Iterate through uploaded files.
  - Return the secure Cloudinary URLs (`path` or `secure_url`) and public IDs.
  - Handle errors from Cloudinary/Multer gracefully.

### **Update Post Model ([models/Post.js](file:///d:/Capstone/Scrolla/server/models/Post.js))**
- Update the `images` validation/schema if necessary.
- Add support for video URLs if not implicitly handled by the string array (or change to an object array to store type). *Decision: Keep as string array for URLs, but ensure frontend can render video tags based on file extension.*

## 3. Frontend Implementation (React)

### **Update Upload Service ([services/uploadService.js](file:///d:/Capstone/Scrolla/client/src/services/uploadService.js))**
- Ensure the service sends data as `FormData`.
- Append files to the form data with a consistent field name (e.g., `files`).
- No changes needed to the content-type header (axios sets `multipart/form-data` automatically with FormData).

### **Update File Upload Component ([components/FileUpload.jsx](file:///d:/Capstone/Scrolla/client/src/components/FileUpload.jsx))**
- Update file input `accept` attribute to allow video files (`image/*,video/*`).
- Update the preview logic:
  - Check file type.
  - Render `<img>` tag for images.
  - Render `<video>` tag with controls for video files.
- Update validation:
  - Increase/Adjust file size limit for videos (e.g., 50MB for video, 5MB for image).
  - Check correct MIME types.

### **Update Post Card Component ([components/PostCard.jsx](file:///d:/Capstone/Scrolla/client/src/components/PostCard.jsx))**
- Update media rendering logic:
  - Iterate through media URLs.
  - Use file extension or metadata to determine if it's an image or video *OR* store media type in DB.
  - Render appropriate HTML element (`img` or `video`).

## 4. Migration Strategy
- Since the database was just reset/migrated, we will start fresh with Cloudinary URLs.
- Existing local file uploads in `uploads/` folder will remain on disk but won't be accessible if we switch the static serving logic or if new posts use full Cloudinary URLs. *New posts will use Cloudinary.*

## 5. Security & Optimization
- Use Cloudinary transformations for optimized delivery (auto format, quality).
- Generate thumbnails for videos if needed (Cloudinary does this automatically with specific URL flags).

