import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AttendanceCard({ record }) {

  const date = record.timestamp
    ? new Date(record.timestamp * 1000).toLocaleString()
    : "N/A";

  return (

    <View style={styles.card}>

      <Text style={styles.id}>🎓 {record.studentID}</Text>

      <Text style={styles.row}>🕐 {date}</Text>

      <Text style={styles.row}>📦 Block #{record.blockNumber}</Text>

      <Text style={styles.row} numberOfLines={1}>
        ✍️  {record.markedBy}
      </Text>

    </View>

  );

}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
  },
  id:  { fontSize: 15, fontWeight: "bold", marginBottom: 6 },
  row: { fontSize: 13, color: "#444", marginBottom: 2 },
});