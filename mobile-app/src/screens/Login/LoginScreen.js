import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import API from "../../service/api";

export default function LoginScreen({ navigation }) {

  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {

    try {

      const res = await API.post("/auth/login", {
        rollNo,
        password
      });

      const role = res.data.role;

      if (role === "student") {
        navigation.navigate("StudentDashboard", { rollNo });
      }

      else if (role === "teacher") {
        navigation.navigate("TeacherDashboard");
      }

      else if (role === "admin") {
        alert("Admin dashboard not created yet");
      }

    } catch (error) {

      alert("Login failed");

    }

  };

  return (

    <View style={{ padding: 20 }}>

      <Text style={{ fontSize: 22 }}>Login</Text>

      <TextInput
        placeholder="Roll Number"
        value={rollNo}
        onChangeText={setRollNo}
        style={{ borderWidth: 1, marginVertical: 10 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginVertical: 10 }}
      />

      <Button
        title="Login"
        onPress={login}
      />

    </View>

  );

}