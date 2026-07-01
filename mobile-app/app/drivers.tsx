import { useState, useEffect, useRef } from "react";
import { FlatList, View, Text, ActivityIndicator, Image, StyleSheet, TouchableOpacity, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../constants/api";
import { useRouter } from "expo-router";
import { useSocket } from "../context/SocketContext";
import { COLORS, SIZES } from "../constants/theme";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Drivers() {
  const { socket } = useSocket();
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const canLoadMore = useRef(true);

  const fetchDrivers = async (currentPage: number) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("accessToken");

      const response = await axios.get(
        `${API_URL}/drivers?page=${currentPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      
      const newDrivers = response.data.drivers;

      if (currentPage === 1) {
        setDrivers(newDrivers);
      } else {
        setDrivers((prev) => [...prev, ...newDrivers]);
      }

      setTotalPages(response.data.totalPages);
      canLoadMore.current = true;
    } catch (error: any) {
      console.log("Fetch Drivers Error:", error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("accessToken");
        router.replace("/login");
      }
      canLoadMore.current = true;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(page);
  }, [page]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = (data: { driverId: string; status: string }) => {
      setDrivers((prevDrivers) =>
        prevDrivers.map((driver) =>
          driver._id === data.driverId
            ? { ...driver, status: data.status }
            : driver
        )
      );
    };

    socket.on("driver-status-changed", handleStatusChange);

    return () => {
      socket.off("driver-status-changed", handleStatusChange);
    };
  }, [socket]);

  const loadMore = () => {
    if (!canLoadMore.current || loading || page >= totalPages) return;
    canLoadMore.current = false;
    setPage((prev) => prev + 1);
  };

  const renderDriver = ({ item }: any) => {
    const isOnline = item.status === "online";
    const isIdle = item.status === "idle";
    const statusColor = isOnline ? COLORS.success : isIdle ? COLORS.warning : COLORS.error;
    const statusBg = `${statusColor}20`;

    return (
      <View style={styles.card}>
        {item.profileImage ? (
          <Image 
            source={{ uri: item.profileImage }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} /> {item.city}
          </Text>
          <Text style={styles.cardSubtitle}>
            <MaterialCommunityIcons name="phone" size={14} color={COLORS.textSecondary} /> {item.phone}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}50` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status || 'offline'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fleet Roster</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={drivers}
        renderItem={renderDriver}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : page >= totalPages && drivers.length > 0 ? (
            <Text style={styles.endText}>End of roster</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    padding: SIZES.lg, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: COLORS.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text, letterSpacing: 1 },
  backBtn: { padding: SIZES.xs },
  
  list: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.lg,
  },
  
  card: {
    backgroundColor: COLORS.glass,
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.sm,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    marginRight: SIZES.md, 
    borderWidth: 2,
    borderColor: COLORS.surfaceLight
  },
  avatarPlaceholder: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: COLORS.surfaceLight, 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: SIZES.md, 
    borderWidth: 2,
    borderColor: COLORS.border
  },
  avatarText: { 
    color: COLORS.text, 
    fontSize: 20, 
    fontWeight: "bold" 
  },
  
  cardInfo: { 
    flex: 1 
  },
  cardName: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: COLORS.text, 
    marginBottom: 4 
  },
  cardSubtitle: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    marginBottom: 2 
  },
  
  statusBadge: { 
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: "bold", 
    textTransform: "uppercase", 
    letterSpacing: 0.5 
  },
  
  endText: { 
    textAlign: "center", 
    marginVertical: 20, 
    color: COLORS.textSecondary,
    fontStyle: "italic" 
  },
});
