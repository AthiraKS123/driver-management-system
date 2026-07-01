import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";
import { COLORS, SIZES } from "../constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email, password }
      );

      await AsyncStorage.setItem(
        "accessToken",
        response.data.accessToken
      );

      router.replace("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>DRIVER PORTAL</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Input Box */}
        <TextInput
          placeholder="Email Address"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {/* Button */}
        <TouchableOpacity
          onPress={handleLogin}
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: SIZES.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: SIZES.xxl,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.glass,
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    marginBottom: SIZES.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius,
    alignItems: "center",
    marginTop: SIZES.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // for Android
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 16,
  },
});