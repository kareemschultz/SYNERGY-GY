import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Check,
  FlipHorizontal2,
  X,
} from "lucide-react-native";
import { useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FacingType = "front" | "back";

/**
 * Document scanner screen using device camera.
 */
export default function DocumentScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<FacingType>("back");
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (result) {
        setPhoto(result.uri);
      }
    }
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const retake = () => {
    setPhoto(null);
  };

  const confirmPhoto = () => {
    // TODO: Upload the photo
    // For now, just go back
    router.back();
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Camera color="#71717a" size={64} />
        <Text className="mt-4 text-center font-semibold text-foreground text-lg">
          Camera Permission Required
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          We need access to your camera to scan documents.
        </Text>
        <Pressable
          className="mt-6 rounded-lg bg-primary px-6 py-3"
          onPress={requestPermission}
        >
          <Text className="font-semibold text-primary-foreground">
            Grant Permission
          </Text>
        </Pressable>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-muted-foreground">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Photo preview
  if (photo) {
    return (
      <View className="flex-1 bg-black">
        <Image
          className="flex-1"
          resizeMode="contain"
          source={{ uri: photo }}
        />

        {/* Action buttons */}
        <View className="absolute right-0 bottom-12 left-0 flex-row justify-center gap-12">
          <Pressable
            className="h-16 w-16 items-center justify-center rounded-full bg-destructive"
            onPress={retake}
          >
            <X color="#ffffff" size={28} />
          </Pressable>
          <Pressable
            className="h-16 w-16 items-center justify-center rounded-full bg-green-500"
            onPress={confirmPhoto}
          >
            <Check color="#ffffff" size={28} />
          </Pressable>
        </View>

        {/* Back button */}
        <SafeAreaView className="absolute top-0 right-0 left-0">
          <Pressable
            className="m-4 h-10 w-10 items-center justify-center rounded-full bg-black/50"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#ffffff" size={24} />
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // Camera view
  return (
    <View className="flex-1 bg-black">
      <CameraView className="flex-1" facing={facing} ref={cameraRef}>
        {/* Header */}
        <SafeAreaView>
          <View className="flex-row items-center justify-between p-4">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
              onPress={() => router.back()}
            >
              <ArrowLeft color="#ffffff" size={24} />
            </Pressable>
            <Text className="font-semibold text-white">Scan Document</Text>
            <View className="w-10" />
          </View>
        </SafeAreaView>

        {/* Frame guide */}
        <View className="flex-1 items-center justify-center p-8">
          <View className="aspect-[4/3] w-full rounded-lg border-2 border-white/50" />
          <Text className="mt-4 text-center text-white/70">
            Position document within the frame
          </Text>
        </View>

        {/* Controls */}
        <SafeAreaView>
          <View className="flex-row items-center justify-center gap-12 pb-8">
            <Pressable
              className="h-12 w-12 items-center justify-center rounded-full bg-white/20"
              onPress={toggleFacing}
            >
              <FlipHorizontal2 color="#ffffff" size={24} />
            </Pressable>
            <Pressable
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20"
              onPress={takePicture}
            >
              <View className="h-14 w-14 rounded-full bg-white" />
            </Pressable>
            <View className="w-12" />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
