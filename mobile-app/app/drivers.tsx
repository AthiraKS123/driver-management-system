import { useState, useEffect, useRef } from "react";
import { FlatList, View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../constants/api";
import { useRouter } from "expo-router";
import { useSocket } from "../context/SocketContext";

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
      console.log(">>> Fetching page:", currentPage, "| totalPages:", totalPages);
console.log(">>> Drivers received:", newDrivers.length);
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
    console.log(">>> loadMore triggered, going to page:", page + 1);

    setPage((prev) => prev + 1);
  };

  const renderDriver = ({ item }: any) => {
    const statusColor =
      item.status === "online"
        ? "🟢"
        : item.status === "idle"
        ? "🟡"
        : "🔴";

    return (
      <View
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
        <Text>📍 {item.city}</Text>
        <Text>📞 {item.phone}</Text>
        <Text>{statusColor} Status: {item.status}</Text>
      </View>
    );
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#f5f6fa" }}
      contentContainerStyle={{ padding: 20 }}
      data={drivers}
      renderItem={renderDriver}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      onEndReached={loadMore}
      onEndReachedThreshold={0.2}
      ListHeaderComponent={
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Drivers 🚚
        </Text>
      }
      ListFooterComponent={
        loading ? (
          <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
        ) : page >= totalPages && drivers.length > 0 ? (
          <Text
            style={{ textAlign: "center", marginVertical: 20, color: "gray" }}
          >
            No more drivers
          </Text>
        ) : null
      }
    />
  );
}
