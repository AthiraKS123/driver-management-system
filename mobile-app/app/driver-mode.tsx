import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from "../constants/api";
import { useSocket } from "../context/SocketContext";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import * as Location from 'expo-location';
import { COLORS, SIZES } from "../constants/theme";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DriverMode() {
  const { socket } = useSocket();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);

  useEffect(() => {
    let sub: any = null;
    
    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Location permission is required to track your position.",
        });
        setIsOnline(false);
        if (socket && socket.connected) {
          socket.emit("driver-offline", selectedDriver._id);
        }
        return;
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          if (socket && socket.connected && selectedDriver) {
            socket.emit("driver-location-update", {
              driverId: selectedDriver._id,
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
        }
      );
      setLocationSubscription(sub);
    };

    if (isOnline && selectedDriver) {
      startTracking();
    } else {
      if (locationSubscription) {
        try { locationSubscription.remove(); } catch (e) { console.warn("Failed to remove location subscription", e); }
        setLocationSubscription(null);
      }
    }

    return () => {
      if (sub) {
        try { sub.remove(); } catch (e) { console.warn("Failed to remove location subscription", e); }
      }
    };
  }, [isOnline, selectedDriver, socket]);

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

  useEffect(() => {
    if (!socket) return;
    const handleConnect = async () => {
      setIsConnected(true);
      await processOfflineQueue();
    };
    const handleDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);
    if (socket.connected) processOfflineQueue();

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
          queue.forEach((action: any) => {
            if (action.type === "driver-online") socket.emit("driver-online", action.driverId);
            else if (action.type === "driver-offline") socket.emit("driver-offline", action.driverId);
          });
          Toast.show({ type: "success", text1: "Sync Complete", text2: `Successfully synced ${queue.length} offline actions.` });
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
      Toast.show({ type: "info", text1: "You are Offline", text2: "Action saved locally. Will sync when reconnected." });
    } catch (error) {
      console.error("Failed to queue action:", error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!selectedDriver) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    const actionType = newStatus ? "driver-online" : "driver-offline";
    if (socket && socket.connected) {
      socket.emit(actionType, selectedDriver._id);
    } else {
      await queueAction(actionType, selectedDriver._id);
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        launchGallery();
        return;
      }
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Toast.show({ type: "error", text1: "Permissions required to upload photo" });
        return;
      }
      Alert.alert("Upload Profile Photo", "Choose an option", [
        { text: "Camera", onPress: () => launchCamera() },
        { text: "Gallery", onPress: () => launchGallery() },
        { text: "Cancel", style: "cancel" }
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  const launchCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const launchGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('profileImage', blob, filename);
      } else {
        formData.append('profileImage', { uri, name: filename, type } as any);
      }

      Toast.show({ type: "info", text1: "Uploading Image..." });
      const res = await axios.put(`${API_URL}/drivers/${selectedDriver._id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setSelectedDriver(res.data.driver);
      setDrivers(prev => prev.map(d => d._id === selectedDriver._id ? res.data.driver : d));
      Toast.show({ type: "success", text1: "Image Uploaded!" });
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Toast.show({ type: "error", text1: "Upload Failed" });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isConnected && (
        <View style={styles.bannerError}>
          <MaterialCommunityIcons name="wifi-off" size={20} color="#fff" />
          <Text style={styles.bannerText}>Offline Mode</Text>
        </View>
      )}
      {isSyncing && (
        <View style={styles.bannerWarning}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.bannerText}>Syncing actions...</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        <Text style={styles.backText}>Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Driver Mode</Text>

      {!selectedDriver ? (
        <View style={styles.driverListContainer}>
          <Text style={styles.subtitle}>Select your profile:</Text>
          {drivers.map((d) => (
            <TouchableOpacity
              key={d._id}
              style={styles.driverCard}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedDriver(d);
                setIsOnline(d.status === "online" || d.status === "idle");
              }}
            >
              <View style={styles.driverCardLeft}>
                <View style={styles.avatarPlaceholderSm}>
                  <Text style={styles.avatarTextSm}>{d.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.driverCardName}>{d.name}</Text>
                  <Text style={styles.driverCardCity}>📍 {d.city}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} activeOpacity={0.8}>
            {selectedDriver.profileImage ? (
              <Image source={{ uri: selectedDriver.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.textSecondary} />
              </View>
            )}
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{selectedDriver.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? `${COLORS.success}20` : `${COLORS.error}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.error }]} />
            <Text style={[styles.statusText, { color: isOnline ? COLORS.success : COLORS.error }]}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleOnlineStatus}
            activeOpacity={0.9}
            style={[
              styles.powerButton,
              {
                backgroundColor: isOnline ? COLORS.error : COLORS.success,
                shadowColor: isOnline ? COLORS.error : COLORS.success,
              }
            ]}
          >
            <MaterialCommunityIcons name="power" size={60} color="#fff" style={{ marginBottom: 10 }} />
            <Text style={styles.powerButtonText}>
              {isOnline ? "GO OFFLINE" : "GO ONLINE"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push(`/chat?driverId=${selectedDriver._id}&driverName=${selectedDriver.name}`)}
          >
            <MaterialCommunityIcons name="message-text" size={20} color="#fff" />
            <Text style={styles.chatButtonText}>Chat with Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changeDriverBtn}
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
            <Text style={styles.changeDriverText}>Switch Driver Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  
  bannerError: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.error, padding: 12, borderRadius: SIZES.borderRadius, marginBottom: SIZES.md },
  bannerWarning: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.warning, padding: 12, borderRadius: SIZES.borderRadius, marginBottom: SIZES.md },
  bannerText: { color: "#fff", fontWeight: "bold" },
  
  backBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: SIZES.lg },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: "600" },
  
  title: { fontSize: 32, fontWeight: "900", color: COLORS.text, marginBottom: SIZES.xl, letterSpacing: 1 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: SIZES.md },
  
  driverListContainer: { flex: 1 },
  driverCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.glass, padding: SIZES.md, borderRadius: SIZES.borderRadius, marginBottom: SIZES.sm, borderWidth: 1, borderColor: COLORS.border },
  driverCardLeft: { flexDirection: "row", alignItems: "center", gap: SIZES.md },
  avatarPlaceholderSm: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, justifyContent: "center", alignItems: "center" },
  avatarTextSm: { color: COLORS.textSecondary, fontWeight: "bold", fontSize: 18 },
  driverCardName: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },
  driverCardCity: { color: COLORS.textSecondary, fontSize: 14 },
  
  profileContainer: { alignItems: "center", paddingTop: SIZES.xl },
  avatarContainer: { position: "relative", marginBottom: SIZES.lg },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.surfaceLight, justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: COLORS.primary },
  editBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: COLORS.background },
  
  profileName: { fontSize: 28, fontWeight: "bold", color: COLORS.text, marginBottom: SIZES.xs },
  
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: SIZES.xxl },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
  
  powerButton: { width: 220, height: 220, borderRadius: 110, justifyContent: "center", alignItems: "center", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 15, marginBottom: SIZES.xxl },
  powerButtonText: { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  
  chatButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.primary, width: "100%", paddingVertical: 16, borderRadius: SIZES.borderRadius, marginBottom: SIZES.lg },
  chatButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },
  
  changeDriverBtn: { padding: SIZES.sm },
  changeDriverText: { color: COLORS.textSecondary, fontSize: 14, textDecorationLine: "underline" },
});
