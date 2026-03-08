import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, FlatList, Text, Button, ActivityIndicator, StyleSheet } from "react-native";
import API, { STUDENT_API, NODE_NAME } from "../../config/api";
import AttendanceCard from "../../components/AttendanceCard/AttendanceCard";

export default function AttendanceList({ route }) {

  // If navigated from StudentDashboard, rollNo is passed → fetch own records only
  const rollNo = route?.params?.rollNo ?? null;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const loadAttendance = async () => {

    setLoading(true);
    setError(null);

    try {

      let res;

      if (rollNo) {
        // Student: fetch own records from Student Node (port 3000)
        res = await STUDENT_API.get(`/attendance/my/${rollNo}`);
      } else {
        // Teacher: fetch all records from Teacher Node (port 4000)
        res = await API.get("/attendance/all");
      }

      setRecords(res.data);

    } catch (err) {

      const msg = err?.response?.data?.error || "Failed to load records";
      setError(msg);

    } finally {

      setLoading(false);

    }

  };

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [rollNo])
  );

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        {rollNo ? `My Records — ${rollNo}` : `All Records — ${NODE_NAME}`}
      </Text>

      <View style={styles.btn}>
        <Button title="↻ Refresh" onPress={loadAttendance} />
      </View>

      {loading && <ActivityIndicator style={{ margin: 20 }} />}

      {error && (
        <Text style={styles.error}>⚠ {error}</Text>
      )}

      {!loading && !error && records.length === 0 && (
        <Text style={styles.empty}>No attendance records found.</Text>
      )}

      <FlatList
        data={records}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => <AttendanceCard record={item} />}
      />

    </View>

  );

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title:     { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  btn:       { marginBottom: 10 },
  error:     { color: "red", marginBottom: 10 },
  empty:     { color: "#888", textAlign: "center", marginTop: 30 },
});