import { MessageSquare, Send } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  content: string;
  isFromClient: boolean;
  createdAt: string;
};

/**
 * Client portal - messages/support screen.
 */
export default function ClientMessagesScreen() {
  const [message, setMessage] = useState("");

  // Mock messages for demo
  const messages: Message[] = [
    {
      id: "1",
      content: "Welcome to GK-Nexus! How can we help you today?",
      isFromClient: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }
    // TODO: Send message via API
    setMessage("");
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      className={`max-w-[80%] rounded-2xl p-3 ${
        item.isFromClient ? "self-end bg-primary" : "self-start bg-secondary"
      }`}
    >
      <Text
        className={
          item.isFromClient ? "text-primary-foreground" : "text-foreground"
        }
      >
        {item.content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="border-border border-b px-4 py-2">
          <Text className="font-bold text-2xl text-foreground">Messages</Text>
          <Text className="text-muted-foreground text-sm">
            Contact our support team
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          className="flex-1 px-4"
          contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
          data={messages}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <MessageSquare color="#71717a" size={48} />
              <Text className="mt-4 text-muted-foreground">
                No messages yet
              </Text>
              <Text className="mt-2 text-center text-muted-foreground text-sm">
                Send a message to start a conversation
              </Text>
            </View>
          }
          renderItem={renderMessage}
        />

        {/* Input */}
        <View className="border-border border-t p-4">
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-foreground"
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#71717a"
              value={message}
            />
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-full bg-primary"
              onPress={sendMessage}
            >
              <Send color="#0c0c0c" size={20} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
