import { Stack } from "expo-router";
import { SocketProvider } from "../context/SocketContext";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  return (
    <SocketProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      />
      <Toast />
    </SocketProvider>
  );
}