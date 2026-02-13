import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const settings = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={s.container}>
      <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={s.title}>Settings</Text>
      <Text style={{ color: "grey" }}>Here is your all settings</Text>
    </SafeAreaView>
  );
};

export default settings;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
});
