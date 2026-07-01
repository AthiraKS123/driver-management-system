import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";
import { API_URL } from "../constants/api";
import { COLORS, SIZES } from "../constants/theme";
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{userName ? userName : "Driver"}!</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() => router.push("/drivers")}
          style={[styles.card, { borderColor: COLORS.accent }]}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${COLORS.accent}20` }]}>
            <MaterialCommunityIcons name="format-list-bulleted" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.cardTitle}>View Drivers</Text>
          <Text style={styles.cardSubtitle}>See all active drivers in the fleet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/driver-mode")}
          style={[styles.card, { borderColor: COLORS.success }]}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${COLORS.success}20` }]}>
            <MaterialCommunityIcons name="steering" size={32} color={COLORS.success} />
          </View>
          <Text style={styles.cardTitle}>Driver Mode</Text>
          <Text style={styles.cardSubtitle}>Simulate GPS & status updates</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutBtn}
      >
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.lg,
    paddingTop: SIZES.xxl,
  },
  header: {
    marginBottom: SIZES.xl,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
  },
  grid: {
    gap: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.glass,
    padding: SIZES.lg,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    flexDirection: "column",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: SIZES.xxl,
    padding: SIZES.md,
    backgroundColor: `${COLORS.error}15`,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: `${COLORS.error}50`,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: "bold",
    fontSize: 16,
  },
});
