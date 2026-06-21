import { Stack } from "expo-router";
import { SocketProvider } from "../context/SocketContext";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <SocketProvider>
      <Stack />
      <Toast />
    </SocketProvider>
  );
}