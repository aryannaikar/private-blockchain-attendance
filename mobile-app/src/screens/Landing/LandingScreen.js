import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
          <Text style={styles.logo}>BlockAttend</Text>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Next Generation Attendance</Text>
          </View>
          
          <Text style={styles.heroTitle}>Blockchain + IoT</Text>
          <Text style={styles.heroSubtitle}>Smart Attendance</Text>
          
          <Text style={styles.heroDesc}>
            Secure, immutable, and automated attendance tracking system leveraging Ethereum smart contracts and ESP32 hardware verification.
          </Text>

          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <FeatureCard 
            title="Blockchain Storage" 
            desc="Immutable records stored on the Ethereum blockchain." 
          />
          <FeatureCard 
            title="ESP32 Verification" 
            desc="Hardware-level verification using IoT devices." 
          />
          <FeatureCard 
            title="Role Based Access" 
            desc="Granular access controls for Students, Teachers, and Admins." 
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 32, alignItems: "center" },
  logo: { fontSize: 24, fontWeight: "bold", color: "#6366F1" },
  
  heroSection: { alignItems: "center", marginBottom: 48 },
  badge: { 
    backgroundColor: "#EEF2FF", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    marginBottom: 16 
  },
  badgeText: { color: "#4F46E5", fontSize: 13, fontWeight: "600" },
  heroTitle: { fontSize: 36, fontWeight: "800", color: "#111827", textAlign: "center" },
  heroSubtitle: { fontSize: 32, fontWeight: "700", color: "#4B5563", marginBottom: 16, textAlign: "center" },
  heroDesc: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 32, lineHeight: 24 },
  
  primaryBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center"
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  featuresSection: { width: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: "#111827", textAlign: "center" },
  featureCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  featureTitle: { fontSize: 16, fontWeight: "bold", color: "#374151", marginBottom: 4 },
  featureDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20 }
});
