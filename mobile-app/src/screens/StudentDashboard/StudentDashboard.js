import React from "react";
import { View, Text, Button } from "react-native";
import API from "../../service/api";

export default function StudentDashboard({ route }) {

  const { rollNo } = route.params;

  const markAttendance = async () => {

    try {

      const res = await API.post("/attendance/mark", {
        role: "student",
        rollNo: rollNo
      });

      alert("Attendance marked\nTX: " + res.data.txHash);

    } catch (error) {

      alert("Error marking attendance");

    }

  };

  return (

    <View style={{ padding: 20 }}>

      <Text style={{ fontSize: 20 }}>
        Student Dashboard
      </Text>

      <Text>
        Roll No: {rollNo}
      </Text>

      <Button
        title="Mark My Attendance"
        onPress={markAttendance}
      />

    </View>

  );

}