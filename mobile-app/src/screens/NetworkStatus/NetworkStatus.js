import React, { useState, useEffect } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet } from "react-native";
import { TEACHER_URL, STUDENT_URL, SERVER_URL } from "../../config/api";
import NodeStatusCard from "../../components/NodeStatusCard/NodeStatusCard";

// List of nodes to probe
const NODES = [
  { name: "Teacher Node",      url: TEACHER_URL, port: 4000 },
  { name: "Student Node",      url: STUDENT_URL, port: 3000 },
  { name: "Server Node",       url: SERVER_URL,  port: 5000 },
];

export default function NetworkStatus() {

  const [nodeData,    setNodeData]    = useState([]);
  const [blockchain,  setBlockchain]  = useState(null);
  const [loading,     setLoading]     = useState(false);

  const fetchStatus = async () => {

    setLoading(true);

    const results = await Promise.all(
      NODES.map(async (node) => {

        try {

          // Each node exposes GET /network/status → blockchain info
          const res  = await fetch(`${node.url}/network/status`, { signal: AbortSignal.timeout(5000) });
          const data = await res.json();

          return {
            name:        node.name,
            status:      "Connected",
            blockNumber: data.blockNumber,
            chainId:     data.chainId,
          };

        } catch {

          return {
            name:   node.name,
            status: "Offline",
          };

        }

      })
    );

    setNodeData(results);

    // Use whichever node responded first for global blockchain info
    const live = results.find(r => r.status === "Connected");
    setBlockchain(live ?? null);

    setLoading(false);

  };

  useEffect(() => { fetchStatus(); }, []);

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Blockchain Network</Text>

      {blockchain && (
        <View style={styles.info}>
          <Text style={styles.infoText}>Chain ID: {blockchain.chainId}</Text>
          <Text style={styles.infoText}>Block: #{blockchain.blockNumber}</Text>
        </View>
      )}

      {loading && <ActivityIndicator style={{ margin: 10 }} />}

      {nodeData.map((node) => (
        <NodeStatusCard
          key={node.name}
          name={node.name}
          status={node.status}
          extra={node.blockNumber ? `Block #${node.blockNumber}` : undefined}
        />
      ))}

      {/* Unauthorized Node is always blocked by design */}
      <NodeStatusCard
        name="Unauthorized Node"
        status="Blocked"
      />

      <View style={styles.btn}>
        <Button title="↻ Refresh" onPress={fetchStatus} />
      </View>

    </View>

  );

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  info:      { backgroundColor: "#e8f4fd", borderRadius: 8, padding: 10, marginBottom: 12 },
  infoText:  { fontSize: 14, color: "#0056b3" },
  btn:       { marginTop: 16 },
});