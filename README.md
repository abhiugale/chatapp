Chat App - Real-time 1:1 Messaging
A real-time chat application built with React Native (Expo) frontend and Node.js backend with Socket.IO. Features include user authentication, real-time messaging, typing indicators, online status, and read receipts.

🚀 Features
User Authentication - JWT-based registration and login

Real-time Messaging - Instant message delivery using Socket.IO

Typing Indicators - See when others are typing

Online/Offline Status - Real-time user presence

Read Receipts - Double ticks for read messages

Message Persistence - All messages stored in MongoDB

Clean UI - Modern, responsive design

🛠️ Setup Instructions
Prerequisites
Node.js 16+ installed

MongoDB installed locally or MongoDB Atlas account

Expo CLI (optional, for mobile development)

Backend Setup
Navigate to server directory:


cd server
Install dependencies:


npm install
Environment Configuration:
Create .env file in server directory:

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat_app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
Start MongoDB:

# Local MongoDB
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
Setup Sample Data:

npm run setup
Start the Server:

npm run dev
Server will run on http://localhost:5000

Frontend Setup
Navigate to mobile directory:

bash
cd mobile
Install dependencies:


npm install
Environment Configuration:
Create .env file in mobile directory:

env
EXPO_PUBLIC_API_URL=http://localhost:5000
Start the Development Server:


npx expo start
Run on Device/Emulator:

Press a for Android emulator

Press i for iOS simulator

Scan QR code with Expo Go app for physical device

🔧 Environment Variables
Backend (.env)
env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat_app
JWT_SECRET=your-jwt-secret-key-here
Frontend (.env)
env
EXPO_PUBLIC_API_URL=http://localhost:5000
For Physical Device Testing
Update the API URL in services/api.ts:

typescript
// For Android emulator: http://10.0.2.2:5000
// For iOS simulator: http://localhost:5000  
// For physical device: http://YOUR_COMPUTER_IP:5000
👥 Sample Users
After running npm run setup in the server directory, these sample users are created:

Name	Email	Password
John Doe	john@example.com	password123
Jane Smith	jane@example.com	password123
Mike Johnson	mike@example.com	password123
You can register new users directly from the app or modify the server/setup.js file to add more sample users.

🎯 API Endpoints
Authentication
POST /auth/register - User registration

POST /auth/login - User login

Users
GET /users - Get all users (except current user)

Messages
GET /messages/conversations/:id/messages - Get conversation messages

POST /messages/conversations - Create or get conversation

Socket Events
message:send - Send new message

message:new - Receive new message

typing:start - User started typing

typing:stop - User stopped typing

message:read - Message read receipt

user_online - User came online

user_status - User status update

🚀 Running the Application
Development
Start Backend:

bash
cd server
npm run dev
Start Frontend (in new terminal):

bash
cd mobile
npx expo start
Production
Build Backend:

bash
cd server
npm start
Build Frontend:

bash
cd mobile
npx expo build:android  # or build:ios
🐛 Troubleshooting
Common Issues
Socket Connection Errors:

Ensure server is running on port 5000

For physical devices, use computer's IP address

Check CORS configuration in server

MongoDB Connection Issues:

Verify MongoDB is running

Check connection string in .env file

Ensure database permissions are correct

Authentication Problems:

Verify JWT secret matches

Check token expiration

Ensure proper headers in API calls

Network Configuration
For physical device testing:

Find your computer's IP address

Update API_URL in mobile services

Ensure devices are on same network

Configure firewall to allow port 5000

📱 Mobile App Features
Login/Registration - Secure JWT authentication

User List - View all users with online status

Real-time Chat - Instant messaging with Socket.IO

Typing Indicators - See when others are typing

Read Receipts - Know when messages are read

Online Status - Real-time user presence updates

🔒 Security Features
JWT token-based authentication

Password hashing with bcrypt

CORS configuration

Input validation

Secure WebSocket connections

📦 Dependencies
Backend
Express.js - Web framework

Socket.IO - Real-time communication

MongoDB - Database

Mongoose - MongoDB ODM

JWT - Authentication

bcryptjs - Password hashing

CORS - Cross-origin resource sharing

Frontend
Expo - React Native framework

Socket.IO-client - Real-time client

Axios - HTTP client

Expo Router - Navigation

AsyncStorage - Local storage

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/amazing-feature)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing-feature)

Open Pull Request

📄 License
This project is licensed under the MIT License.

📞 Support
For support, abhiugale2002@gmail.com or create an issue in the repository.
