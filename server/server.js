import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
// import { generateToken } from "./lib/utils.js";

//  Create Express app and HTTP server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// Store online users
export const userSocketMap = {};  //{ userId: socketId }       //store data of online users

// socket.io connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if(userId) userSocketMap[userId] = socket.id;

    // Emit online Users to all connected Clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

// Route Setup  
app.use("/api/status",(req,res)=> res.send("Server is Live"));
app.use("/api/auth", userRouter)
app.use("/api/messages",messageRouter)

// Connect to Database
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Server is running on PORT: " + PORT));
