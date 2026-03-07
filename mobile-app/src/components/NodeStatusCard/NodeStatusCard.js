import React from "react";
import { View, Text } from "react-native";
import styles from "./NodeStatusCardStyle";

export default function NodeStatusCard({ name, status }) {

  return (

    <View style={styles.card}>

      <Text style={styles.node}>{name}</Text>
      <Text style={styles.status}>{status}</Text>

    </View>

  );

}