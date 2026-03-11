import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function NotFoundScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>
        The attendance record or specific page you're searching for does not exist or you don't have access to it.
      </Text>

      <TouchableOpacity 
        style={styles.btn}
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Landing")}
      >
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff"
  },
  code: { fontSize: 72, fontWeight: "900", color: "#EF4444", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 32, lineHeight: 24 },
  btn: {
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" }
});
