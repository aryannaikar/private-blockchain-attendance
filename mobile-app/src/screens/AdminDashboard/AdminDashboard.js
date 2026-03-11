import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Button, ScrollView, RefreshControl } from "react-native";
import { SERVER_API } from "../../config/api";

export default function AdminDashboard({ navigation }) {
  const [records, setRecords] = useState([]);
  const [blockNumber, setBlockNumber] = useState(0);
  const [chainId, setChainId] = useState("—");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all attendance records
      const attRes = await SERVER_API.get("/attendance/all");
      setRecords(attRes.data || []);

      // Fetch network status
      const netRes = await SERVER_API.get("/network-status");
      setBlockNumber(Number(netRes.data.blockNumber) || 0);
      setChainId(netRes.data.chainId || "—");
    } catch (error) {
      console.error("Error loading admin data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uniqueStudents = [...new Set(records.map(r => r.studentID))].length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      <Text style={styles.title}>System Overview</Text>
      <Text style={styles.sub}>Admin control panel for BlockAttend</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Unique Students</Text>
          <Text style={styles.statValue}>{loading ? "…" : uniqueStudents}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Records</Text>
          <Text style={styles.statValue}>{loading ? "…" : records.length}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Chain ID</Text>
          <Text style={styles.statValue}>{loading ? "…" : chainId}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Latest Block</Text>
          <Text style={styles.statValue}>{loading ? "…" : `#${blockNumber}`}</Text>
        </View>
      </View>

      <View style={styles.btn}>
        <Button 
          title="Manage Users" 
          onPress={() => navigation.navigate("ManageUsers")} 
        />
      </View>
      
      <View style={styles.btn}>
        <Button 
          title="Network Status" 
          onPress={() => navigation.navigate("Network Status")} 
          color="#666"
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  sub:       { fontSize: 15, color: "#555", marginBottom: 20 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    marginHorizontal: 4,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  btn: { marginBottom: 16 },
});
