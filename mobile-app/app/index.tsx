import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { COLORS } from "../constants/theme";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    
    // Add a tiny delay just so the splash screen doesn't instantly flash
    setTimeout(() => {
      if (token) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 20, color: COLORS.textSecondary, fontWeight: 'bold', fontSize: 16, letterSpacing: 2 }}>
        DRIVER FLEET
      </Text>
    </View>
  );
}