import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import API from "../../config/api";

export default function TeacherDashboard({ navigation }) {

  const [studentID,        setStudentID]        = useState("");
  const [studentsConnected, setStudentsConnected] = useState(0);
  const [sessionStatus,    setSessionStatus]    = useState("CLOSED");
  const [marking,          setMarking]          = useState(false);

  // ── Poll ESP32 every 3 s ──────────────────────────────────────────────────
  const checkESPStatus = async () => {

    try {

      const res  = await fetch("http://192.168.4.1/status", { signal: AbortSignal.timeout(3000) });
      const data = await res.json();

      setStudentsConnected(data.students ?? 0);
      setSessionStatus(data.status ?? "UNKNOWN");

    } catch {

      setSessionStatus("OFFLINE");
      setStudentsConnected(0);

    }

  };

  useEffect(() => {

    checkESPStatus();

    const interval = setInterval(checkESPStatus, 3000);

    return () => clearInterval(interval);

  }, []);

  // ── Open attendance session on ESP32 ─────────────────────────────────────
  const startServer = async () => {

    try {

      const res = await fetch("http://192.168.4.1/start", { signal: AbortSignal.timeout(5000) });

      if (res.ok) {
        alert("✅ Attendance session started");
        checkESPStatus();
      } else {
        alert("⚠ ESP32 returned an error");
      }

    } catch {

      alert("❌ Cannot reach ESP32 — connect to classroom Wi-Fi first");

    }

  };

  // ── Mark attendance for a student on Teacher Node (port 4000) ─────────────
  const markAttendance = async () => {

    if (!studentID.trim()) {
      alert("Enter a student ID first");
      return;
    }

    if (marking) return;
    setMarking(true);

    try {

      const res = await API.post("/attendance/mark", {
        role:      "teacher",
        studentID: studentID.trim(),
      });

      alert("✅ Attendance marked!\nTX: " + res.data.txHash);
      setStudentID("");

    } catch (error) {

      const msg = error?.response?.data?.error || "Error marking attendance";
      alert("❌ " + msg);

    } finally {

      setMarking(false);

    }

  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (

    <View style={styles.container}>

      <Text style={styles.title}>Blockchain Attendance</Text>

      {/* Session status from ESP32 */}
      <View style={[styles.badge, sessionStatus === "OPEN" ? styles.open : sessionStatus === "OFFLINE" ? styles.offline : styles.closed]}>
        <Text style={styles.badgeText}>Session: {sessionStatus}</Text>
      </View>

      <Text style={styles.sub}>Students Connected: {studentsConnected}</Text>

      {/* Start attendance window on ESP32 */}
      <View style={styles.btn}>
        <Button title="Start Attendance Server" onPress={startServer} />
      </View>

      {/* Mark specific student */}
      <TextInput
        style={styles.input}
        placeholder="Enter Student ID (e.g. STU001)"
        value={studentID}
        onChangeText={setStudentID}
        autoCapitalize="characters"
      />

      <View style={styles.btn}>
        {marking
          ? <ActivityIndicator />
          : <Button title="Mark Attendance" onPress={markAttendance} />
        }
      </View>

      {/* View all records */}
      <View style={styles.btn}>
        <Button
          title="View All Attendance Records"
          onPress={() => navigation.navigate("Attendance Records")}
        />
      </View>

      {/* Network status */}
      <View style={styles.btn}>
        <Button
          title="Network Status"
          onPress={() => navigation.navigate("Network Status")}
        />
      </View>

    </View>

  );

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  badge:     { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  open:      { backgroundColor: "#d4edda" },
  closed:    { backgroundColor: "#f8d7da" },
  offline:   { backgroundColor: "#e2e3e5" },
  badgeText: { fontSize: 13, fontWeight: "600" },
  sub:       { fontSize: 14, color: "#555", marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: "#ccc",
    borderRadius: 8, padding: 10,
    marginBottom: 12, fontSize: 15,
  },
  btn: { marginBottom: 10 },
});