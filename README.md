# ✨ Video Calling Interview Platform

A full-featured remote interview platform with video calling, screen sharing, recording, and secure authentication. Built with Next.js, TypeScript, Stream, Convex, and Clerk.

---

## 🎬 Project Walkthrough Video

[![Watch the video](https://img.youtube.com/vi/3H92fcVwdvY/0.jpg)](https://www.youtube.com/watch?v=3H92fcVwdvY)

[Watch on YouTube](https://www.youtube.com/watch?v=3H92fcVwdvY)

---

## 🚀 Live Demo

[https://codemeet-ndaz.onrender.com](https://codemeet-ndaz.onrender.com)

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

---

## ✨ Features
- 🚀 Modern tech stack: Next.js, TypeScript, Stream, Convex, Clerk
- 🎥 High-quality video calls
- 🖥️ Screen sharing for collaborative interviews
- 🎬 Screen recording for review and feedback
- 🔒 Secure authentication & authorization (Clerk)
- 💻 Server and client components
- 🛣️ Dynamic & static routing
- 🎨 Beautiful UI with Tailwind CSS & Shadcn
- 📱 Responsive design for all devices
- 📝 Real-time chat and messaging (Stream)
- 📂 Interview session management
- 🗂️ User dashboard for interview history
- ⏱️ Timer and code editor integration (optional)
- 🌐 Deployed and ready to use

---

## 🛠️ Tech Stack
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Convex (serverless functions & database)
- **Video/Chat:** Stream
- **Authentication:** Clerk
- **Other:** ESLint, Prettier, Vercel/Render for deployment

---

## 🖼️ Screenshots

<!-- Add screenshots here if available -->

---

## ⚡ Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd remote-interview-platform

# Install dependencies
npm install

# Set up environment variables (see below)

# Run the app
dev: npm run dev
build: npm run build && npm start
```

App runs at [http://localhost:3000](http://localhost:3000) by default.

---

## 🔑 Environment Variables
Create a `.env` file in the root directory with the following:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
```

---

## 📖 Usage
1. Register or log in with Clerk authentication.
2. Start or join an interview session.
3. Use video call, screen sharing, and chat features.
4. Record sessions for later review.
5. Access your dashboard to view past interviews.

---

## 📁 Project Structure
```
remote-interview-platform/
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # Reusable React components
│   ├── constants/         # App-wide constants
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── convex/            # Convex backend logic
│   └── ...
├── .env                   # Environment variables
├── package.json           # Project metadata & scripts
└── README.md              # Project documentation
```

---

## 🐛 Troubleshooting
- **Port already in use:** Kill the process using the port or change the port in `.env`.
- **Env errors:** Double-check your environment variables.
- **Build errors:** Run `npm install` to ensure all dependencies are installed.
- **Video/stream issues:** Verify your Stream API keys and network connection.

---

## 🤝 Contributing
1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🙏 Acknowledgments
- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Stream](https://getstream.io/)
- [Convex](https://convex.dev/)
- [Clerk](https://clerk.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)

---

<div align="center">
Built with ❤️ for seamless remote interviews.
</div>

