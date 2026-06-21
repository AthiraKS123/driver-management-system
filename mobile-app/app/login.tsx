import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const handleLogin = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      { email, password }
    );

    console.log("LOGIN RESPONSE:", response.data);

    await AsyncStorage.setItem(
      "accessToken",
      response.data.accessToken
    );

    const check = await AsyncStorage.getItem("accessToken");
    console.log("TOKEN SAVED IN STORAGE:", check);

    router.replace("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f5f6fa",
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        Driver Login 🚚
      </Text>

      {/* Input Box */}
      <TextInput
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#ddd",
          marginBottom: 15,
        }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#ddd",
          marginBottom: 20,
        }}
      />

      {/* Button */}
      <TouchableOpacity
onPress={handleLogin}
        style={{
          backgroundColor: "#2f80ed",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Login
        </Text>
      </TouchableOpacity>

      {/* Preview text */}
      <Text
        style={{
          marginTop: 20,
          textAlign: "center",
          color: "gray",
        }}
      >
        {email}
      </Text>
    </View>
  );
}