// Logic function and state variable are added here

import { createContext } from "react";
import axios from 'axios'
import { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { data } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL; 
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({children})=>{

    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null)
    const [OnlineUsers, setOnlineUsers] = useState(null)
    const [socket, setSocket] = useState(null)

    // Check if user is authenticated and if so, set the user data  and connect the socket
    const checkAuth = async () =>{
        try {
            const {data} = await axios.get("/api/auth/check");
            if(data.success){
                setAuthUser(data.user)
                connectSSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Login function to handle user authentication and socket connection
    const login = async (state, credentials)=>{
        try {
            console.log("Sending Credentials ",credentials)
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            console.log("this is causing error",data)
            if(data.success)
                console.log("first this is causing an error")
            if(data.success){
                setAuthUser(data.userData);
                connectSSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token)
                toast.success(data.message)
            }else{
                toast.error(error.response?.data?.message || "Something went wrong")
            }
        } catch (error) {
            console.log(error)
            toast.error(data.message || "Something went wrong...")
        }
    }

    // Logout function to handle user logout and socket disconnection

    const logout = async () => {
        localStorage.removeItem("token")
        setToken(null);
        setAuthUser(null)
        setOnlineUsers([])
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully")
        socket.disconnect();
    }

    // Update profile function to handle user profile updates
    const updateProfile = async (body)=>{
        try {
            const { data } = await axios.put("/api/auth/update-profile",body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updated successfully")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Connect Socket function to handle socket connection and online users updates
    const connectSSocket = (userData)=>{
        if(!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            }
        });
        newSocket.connect();
        setSocket(newSocket);
        
        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUsers(userIds);
        }) 
    }

    useEffect(()=>{
        if(token){
            axios.defaults.headers.common["token"]=token;
        }
        checkAuth();
    },[])

    const value = {
        axios,
        authUser,
        OnlineUsers,
        socket,
        login,
        logout,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}