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
- MongoDB with Mongoose ODM
- JWT authentication
- bcryptjs for password hashing
- Cloudinary for media storage (images & videos)
- Helmet for HTTP security headers
- express-rate-limit for API abuse prevention
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
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   > **Note**: For MongoDB Atlas, replace `MONGODB_URI` with your connection string:
   > ```
   > MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scrolla
   > ```
   
   > **Cloudinary**: Sign up at [cloudinary.com](https://cloudinary.com) and copy your credentials from the Dashboard.

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

- Advanced analytics dashboard
- AI-powered content recommendations
- Group discussions and communities
- Dark mode toggle
- Progressive Web App (PWA) support
- Mobile native apps (iOS/Android)
- Cutomized Algorithm
---

**Built with ❤️ for mindful social media consumption**
