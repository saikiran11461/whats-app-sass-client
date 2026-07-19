import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Types
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  subscribeToCampaign: (campaignId: string) => void;
  unsubscribeFromCampaign: (campaignId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  updateStatus: (status: "online" | "away" | "busy" | "offline") => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Socket.IO connects with cookies automatically when withCredentials is used
    const socket = io({
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connected", (data) => {
      // Joined personal rooms
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:join", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:leave", conversationId);
  }, []);

  const subscribeToCampaign = useCallback((campaignId: string) => {
    socketRef.current?.emit("campaign:subscribe", campaignId);
  }, []);

  const unsubscribeFromCampaign = useCallback((campaignId: string) => {
    socketRef.current?.emit("campaign:unsubscribe", campaignId);
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:start", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:stop", { conversationId });
  }, []);

  const updateStatus = useCallback((status: "online" | "away" | "busy" | "offline") => {
    socketRef.current?.emit("user:status", status);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinConversation,
        leaveConversation,
        subscribeToCampaign,
        unsubscribeFromCampaign,
        startTyping,
        stopTyping,
        updateStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

// Hook to listen for socket events
export function useSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  deps: any[] = []
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, ...deps]);
}
