import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../constants/api";
import { useSocket } from "../context/SocketContext";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

export default function DriverMode() {
  const { socket } = useSocket();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const response = await axios.get(`${API_URL}/drivers?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDrivers(response.data.drivers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // Sync Logic
  useEffect(() => {
    if (!socket) return;

    const handleConnect = async () => {
      setIsConnected(true);
      await processOfflineQueue();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    setIsConnected(socket.connected);
    if (socket.connected) {
       processOfflineQueue();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const processOfflineQueue = async () => {
    try {
      setIsSyncing(true);
      const queueStr = await AsyncStorage.getItem("offlineQueue");
      if (queueStr && socket && socket.connected) {
        const queue = JSON.parse(queueStr);
        if (queue.length > 0) {
          // Process all queued actions
          queue.forEach((action: any) => {
            if (action.type === "driver-online") {
              socket.emit("driver-online", action.driverId);
            } else if (action.type === "driver-offline") {
              socket.emit("driver-offline", action.driverId);
            }
          });
          
          Toast.show({
            type: "success",
            text1: "Sync Complete",
            text2: `Successfully synced ${queue.length} offline actions.`,
          });
          
          // Clear queue
          await AsyncStorage.removeItem("offlineQueue");
        }
      }
    } catch (error) {
      console.error("Failed to process queue:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const queueAction = async (type: "driver-online" | "driver-offline", driverId: string) => {
    try {
      const queueStr = await AsyncStorage.getItem("offlineQueue");
      const queue = queueStr ? JSON.parse(queueStr) : [];
      queue.push({ type, driverId, timestamp: Date.now() });
      await AsyncStorage.setItem("offlineQueue", JSON.stringify(queue));
      
      Toast.show({
        type: "info",
        text1: "You are Offline",
        text2: "Action saved locally. Will sync when reconnected.",
      });
    } catch (error) {
      console.error("Failed to queue action:", error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!selectedDriver) return;

    const newStatus = !isOnline;
    setIsOnline(newStatus); // Optimistic UI update

    const actionType = newStatus ? "driver-online" : "driver-offline";

    if (socket && socket.connected) {
      socket.emit(actionType, selectedDriver._id);
    } else {
      await queueAction(actionType, selectedDriver._id);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2f80ed" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f6fa" }} contentContainerStyle={{ padding: 20 }}>
      {/* Network Connectivity Banner */}
      {!isConnected && (
        <View style={{ backgroundColor: "#ff4757", padding: 10, borderRadius: 8, marginBottom: 15, alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "bold" }}>⚠️ No Internet Connection (Offline Mode)</Text>
        </View>
      )}
      {isSyncing && (
        <View style={{ backgroundColor: "#ffa502", padding: 10, borderRadius: 8, marginBottom: 15, alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "bold" }}>🔄 Syncing pending actions...</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Text style={{ color: "#2f80ed", fontSize: 16 }}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 }}>
        Driver Mode 🚗
      </Text>

      {!selectedDriver ? (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 15 }}>Select who you are logging in as:</Text>
          {drivers.map((d) => (
            <TouchableOpacity
              key={d._id}
              style={{ backgroundColor: "white", padding: 15, borderRadius: 10, marginBottom: 10 }}
              onPress={() => {
                setSelectedDriver(d);
                // BUG FIX: Sync local UI state with driver's actual remote state!
                setIsOnline(d.status === "online" || d.status === "idle");
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>{d.name}</Text>
              <Text style={{ color: "gray" }}>📍 {d.city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
            Welcome, {selectedDriver.name}!
          </Text>
          <Text style={{ fontSize: 16, color: "gray", marginBottom: 40 }}>
            Current Status: {isOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}
          </Text>

          <TouchableOpacity
            onPress={toggleOnlineStatus}
            style={{
              width: 250,
              height: 250,
              borderRadius: 125,
              backgroundColor: isOnline ? "#ff4757" : "#2ed573",
              justifyContent: "center",
              alignItems: "center",
              elevation: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
            }}
          >
            <Text style={{ color: "white", fontSize: 32, fontWeight: "bold", textAlign: "center" }}>
              {isOnline ? "GO\nOFFLINE" : "GO\nONLINE"}
            </Text>
          </TouchableOpacity>

          {!isConnected && (
            <Text style={{ marginTop: 20, color: "#666", fontStyle: "italic", textAlign: "center" }}>
              Changes will be saved locally and synced later.
            </Text>
          )}

          <TouchableOpacity
            style={{ marginTop: 50 }}
            onPress={async () => {
              if (isOnline) {
                setIsOnline(false);
                if (socket && socket.connected) {
                  socket.emit("driver-offline", selectedDriver._id);
                } else {
                  await queueAction("driver-offline", selectedDriver._id);
                }
              }
              setSelectedDriver(null);
            }}
          >
            <Text style={{ color: "#2f80ed", fontSize: 16 }}>Change Driver</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
