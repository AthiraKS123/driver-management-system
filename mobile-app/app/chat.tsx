import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSocket } from "../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../constants/api";
import Toast from "react-native-toast-message";
import { COLORS, SIZES } from "../constants/theme";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ChatScreen() {
  const router = useRouter();
  const { driverId, driverName } = useLocalSearchParams();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchHistory();
  }, [driverId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceive = (msg: any) => {
      if (msg.driver === driverId) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    
    socket.on("receive-message", handleReceive);
    
    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, [socket, driverId]);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`${API_URL}/chat/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Failed to load chat history" });
    }
  };

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    socket.emit("send-message", {
      driverId,
      senderRole: "driver",
      text: text.trim(),
    });

    setText("");
  };

  const renderItem = ({ item }: any) => {
    const isMe = item.senderRole === "driver";
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.adminMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.adminMessageText]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispatch Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: SIZES.md, gap: SIZES.sm }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textSecondary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  
  messageBubble: { 
    maxWidth: "80%", 
    padding: 14, 
    borderRadius: 20, 
  },
  myMessage: { 
    alignSelf: "flex-end", 
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  adminMessage: { 
    alignSelf: "flex-start", 
    backgroundColor: COLORS.surfaceLight,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  messageText: { fontSize: 16 },
  myMessageText: { color: "#fff" },
  adminMessageText: { color: COLORS.text },
  
  inputContainer: { 
    flexDirection: "row", 
    padding: SIZES.md, 
    paddingBottom: Platform.OS === 'ios' ? 30 : SIZES.md,
    backgroundColor: COLORS.surface, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  input: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    color: COLORS.text,
    borderRadius: 24, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sendButton: { 
    marginLeft: SIZES.sm, 
    backgroundColor: COLORS.primary, 
    width: 48,
    height: 48,
    borderRadius: 24, 
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
