import { View, Text, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";

export default function Dashboard() {
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("accessToken");

      console.log("TOKEN:", token);
    };

    getToken();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      const response = await axios.get("http://192.168.1.4:5000/api/drivers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);

      setDrivers(response.data.drivers);
    } catch (error) {
      console.log(error);
    }
  };
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
        Welcome Driver 🚚
      </Text>
      {drivers.map((driver: any) => (
  <Text key={driver._id}>
    {driver.name} - {driver.city}
  </Text>
))}
<TouchableOpacity
  onPress={() => router.push("/drivers")}
  style={{
    marginTop: 20,
    backgroundColor: "#2f80ed",
    padding: 15,
    borderRadius: 10,
  }}
>
  <Text style={{ color: "white" }}>
    View Drivers
  </Text>
</TouchableOpacity>
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 20,
          backgroundColor: "red",
          padding: 15,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
