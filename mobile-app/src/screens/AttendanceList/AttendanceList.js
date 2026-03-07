import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, FlatList, Text, Button } from "react-native";
import styles from "./AttendanceListStyle";
import API from "../../config/api";
import AttendanceCard from "../../components/AttendanceCard/AttendanceCard";

import { NODE_NAME } from "../../config/api";

export default function AttendanceList() {

  const [records, setRecords] = useState([]);

  const loadAttendance = async () => {

    try {

      const res = await API.get("/attendance/all");

      setRecords(res.data);

    } catch (error) {

      console.log(error);

    }

  };

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [])
  );

  return (

    <View style={styles.container}>

      <Text style={{fontSize:18, fontWeight:"bold"}}>
        Connected Node: {NODE_NAME}
      </Text>

      <Button
        title="Refresh"
        onPress={loadAttendance}
      />

      <FlatList
        data={records}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <AttendanceCard record={item} />
        )}
      />

    </View>

  );
}