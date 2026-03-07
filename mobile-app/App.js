import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "./src/screens/Login/LoginScreen";
import TeacherDashboard from "./src/screens/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "./src/screens/StudentDashboard/StudentDashboard";
import AttendanceList from "./src/screens/AttendanceList/AttendanceList";
import NetworkStatus from "./src/screens/NetworkStatus/NetworkStatus";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        {/* LOGIN SCREEN */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        {/* TEACHER */}
        <Stack.Screen
          name="TeacherDashboard"
          component={TeacherDashboard}
          options={{ title: "Teacher Dashboard" }}
        />

        {/* STUDENT */}
        <Stack.Screen
          name="StudentDashboard"
          component={StudentDashboard}
          options={{ title: "Student Dashboard" }}
        />

        {/* ATTENDANCE LIST */}
        <Stack.Screen
          name="Attendance Records"
          component={AttendanceList}
        />

        {/* NETWORK STATUS */}
        <Stack.Screen
          name="Network Status"
          component={NetworkStatus}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}