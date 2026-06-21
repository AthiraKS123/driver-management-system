import { View, Text, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";
import { API_URL } from "../constants/api";

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) return;
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data?.name) {
          setUserName(response.data.name);
        }
      } catch (error) {
        console.log("Failed to fetch user profile", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("accessToken");
    router.replace("/login");
  };
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        Welcome {userName ? userName : "Driver"} 🚚
      </Text>
<TouchableOpacity
  onPress={() => router.push("/drivers")}
  style={{
    marginTop: 20,
    backgroundColor: "#2f80ed",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  }}
>
  <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
    View Drivers
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => router.push("/driver-mode")}
  style={{
    marginTop: 20,
    backgroundColor: "#2ed573",
    padding: 15,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  }}
>
  <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
    Simulate Driver Mode
  </Text>
</TouchableOpacity>
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 20,
          backgroundColor: "#ff4757",
          padding: 15,
          borderRadius: 10,
          width: "80%",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
