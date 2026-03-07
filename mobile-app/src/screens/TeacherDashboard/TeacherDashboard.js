import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import styles from "./TeacherDashboardStyle";
import API from "../../service/api";

export default function TeacherDashboard({ navigation }) {

  const [studentID, setStudentID] = useState("");

  const markAttendance = async () => {

    try {

      if(!studentID){
        alert("Enter student ID");
        return;
      }

      const res = await API.post("/attendance/mark", {
        role: "teacher",
        studentID: studentID
      });

      alert("Attendance marked\nTX: " + res.data.txHash);

      setStudentID("");

    } catch (error) {

      console.log(error);

      alert("Error marking attendance");

    }

  };

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Blockchain Attendance</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Student ID"
        value={studentID}
        onChangeText={setStudentID}
      />

      <Button
        title="Mark Attendance"
        onPress={markAttendance}
      />

      <View style={styles.buttonSpace}>

        <Button
          title="View Attendance"
          onPress={() => navigation.navigate("Attendance Records")}
        />

      </View>

      <View style={styles.buttonSpace}>

        <Button
          title="Network Status"
          onPress={() => navigation.navigate("Network Status")}
        />

      </View>

    </View>

  );
}