import React from "react";
import { View, Text } from "react-native";
import styles from "./AttendanceCardStyle";

export default function AttendanceCard({ record }) {

  return (

    <View style={styles.card}>

      <Text>Student ID: {record.studentID}</Text>
      <Text>Timestamp: {record.timestamp}</Text>
      <Text>Block: {record.blockNumber}</Text>
      <Text>Marked By: {record.markedBy}</Text>

    </View>

  );

}