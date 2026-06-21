import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { API_URL } from "../constants/api";
import Toast from "react-native-toast-message";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // The backend Socket.io is listening on the root domain (port 5000)
    // API_URL is something like http://192.168.1.4:5000/api
    // We need to strip the '/api' to get the base socket URL
    const baseURL = API_URL.replace("/api", "");

    const newSocket = io(baseURL, {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("notification", (data: any) => {
      Toast.show({
        type: "info",
        text1: "New Update",
        text2: data.message || "You have a new notification",
        position: "bottom",
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
