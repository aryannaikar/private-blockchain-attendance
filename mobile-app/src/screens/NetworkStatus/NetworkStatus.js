import React from "react";
import { View, Text } from "react-native";
import styles from "./NetworkStatusStyle";
import NodeStatusCard from "../../components/NodeStatusCard/NodeStatusCard";

export default function NetworkStatus() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Blockchain Network</Text>

      <NodeStatusCard name="Admin Node" status="Connected" />
      <NodeStatusCard name="Teacher Node" status="Connected" />
      <NodeStatusCard name="Server Node" status="Connected" />
      <NodeStatusCard name="Unauthorized Node" status="Blocked" />

    </View>

  );

}