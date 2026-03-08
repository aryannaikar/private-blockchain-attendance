import React, { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { STUDENT_API } from "../../config/api";
import RNBluetoothClassic from "react-native-bluetooth-classic";

const ESP32_NAME = "Teacher_Attendance"; // Must match SerialBT.begin() name

export default function StudentDashboard({ route, navigation }) {

  const { rollNo } = route.params;

  const [sessionOpen, setSessionOpen] = useState(false);
  const [btStatus,    setBtStatus]    = useState("Checking BT…");
  const [timeLeft, setTimeLeft]       = useState(180); // 3 minutes
  const [marking, setMarking]         = useState(false);
  const deviceRef = useRef(null);

  // ── Scan for ESP32 (Beacon Mode) ──────────────────────────────────────────
  const checkSession = async () => {
    setBtStatus("Scanning classroom for ESP32…");
    try {
      // Ensure Bluetooth is enabled
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        setBtStatus("Please enable Bluetooth");
        setSessionOpen(false);
        return;
      }

      // Start discovering unpaired/nearby devices
      const discovery = await RNBluetoothClassic.startDiscovery();
      
      // Look for our specific ESP32 name in the discovered list
      const esp = discovery.find(d => d.name === ESP32_NAME);

      if (esp) {
        setSessionOpen(true);
        setBtStatus("Session OPEN ✅ (Device Found)");
      } else {
        setSessionOpen(false);
        setBtStatus("Session CLOSED (Device not in range)");
      }

    } catch (e) {
      setBtStatus("Scan Error: " + (e.message ?? "unknown"));
      setSessionOpen(false);
    } finally {
      // Always stop discovery so we don't drain battery
      try { await RNBluetoothClassic.cancelDiscovery(); } catch {}
    }
  };

  // ── Countdown + initial session check ─────────────────────────────────────
  useEffect(() => {

    checkSession();

    const timer = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {
          clearInterval(timer);
          setSessionOpen(false);
          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => {
      clearInterval(timer);
      // Disconnect BT if component unmounts mid-connection
      deviceRef.current?.disconnect().catch(() => {});
    };

  }, []);

  // ── Mark attendance on Student Node (port 3000) ───────────────────────────
  const markAttendance = async () => {

    if (marking) return;

    setMarking(true);

    try {

      const res = await STUDENT_API.post("/attendance/mark", {
        role:   "student",
        rollNo: rollNo,
      });

      alert("✅ Attendance marked!\nTX: " + res.data.txHash);

    } catch (error) {

      const msg = error?.response?.data?.error || "Error marking attendance";
      alert("❌ " + msg);

    } finally {

      setMarking(false);

    }

  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (

    <View style={styles.container}>

      <Text style={styles.title}>Student Dashboard</Text>

      <Text style={styles.sub}>Roll No: {rollNo}</Text>

      {/* Session status */}
      <View style={[styles.badge, sessionOpen ? styles.open : styles.closed]}>
        <Text style={styles.badgeText}>
          Session: {sessionOpen ? "OPEN" : "CLOSED"}
        </Text>
      </View>

      {/* Bluetooth status */}
      <Text style={styles.btStatus}>{btStatus}</Text>

      {/* Countdown */}
      <Text style={styles.timer}>
        Attendance Window: {formatTime(timeLeft)}
      </Text>

      {/* Mark attendance */}
      <View style={styles.btn}>
        <Button
          title={marking ? "Marking…" : "Mark My Attendance"}
          disabled={!sessionOpen || marking}
          onPress={markAttendance}
        />
      </View>

      {/* Re-check BT session manually */}
      <View style={styles.btn}>
        <Button title="🔄 Re-check via Bluetooth" onPress={checkSession} />
      </View>

      {!sessionOpen && (
        <Text style={styles.hint}>
          Make sure ESP32 is on and you have paired "Teacher_Attendance" in phone Bluetooth settings.
        </Text>
      )}

      {/* View own records from blockchain */}
      <View style={styles.btn}>
        <Button
          title="View My Attendance Records"
          onPress={() =>
            navigation.navigate("Attendance Records", { rollNo })
          }
        />
      </View>

    </View>

  );

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  sub:       { fontSize: 15, color: "#555", marginBottom: 16 },
  badge:     { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  open:      { backgroundColor: "#d4edda" },
  closed:    { backgroundColor: "#f8d7da" },
  badgeText: { fontSize: 13, fontWeight: "600" },
  timer:     { fontSize: 16, marginBottom: 16, color: "#333" },
  btn:       { marginBottom: 12 },
  hint:      { color: "#888", fontSize: 13, marginBottom: 12 },
  btStatus:  { color: "#555", fontSize: 12, fontStyle: "italic", marginBottom: 10 },
});