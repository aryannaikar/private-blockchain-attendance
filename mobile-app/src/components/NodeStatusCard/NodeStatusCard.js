import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function NodeStatusCard({ name, status, extra }) {

  const isOnline = status === "Connected";
  const isBlock  = status === "Blocked";

  return (

    <View style={[styles.card, isOnline ? styles.online : isBlock ? styles.blocked : styles.offline]}>

      <Text style={styles.node}>{name}</Text>
      <Text style={styles.status}>{status}</Text>
      {extra && <Text style={styles.extra}>{extra}</Text>}

    </View>

  );

}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  online:  { backgroundColor: "#d4edda" },
  blocked: { backgroundColor: "#fff3cd" },
  offline: { backgroundColor: "#f8d7da" },
  node:    { fontSize: 15, fontWeight: "bold" },
  status:  { marginTop: 3, fontSize: 13 },
  extra:   { marginTop: 2, fontSize: 12, color: "#555" },
});