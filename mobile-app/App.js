import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen      from "./src/screens/Login/LoginScreen";
import TeacherDashboard from "./src/screens/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "./src/screens/StudentDashboard/StudentDashboard";
import AttendanceList   from "./src/screens/AttendanceList/AttendanceList";
import NetworkStatus    from "./src/screens/NetworkStatus/NetworkStatus";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        {/* Login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Blockchain Attendance" }}
        />

        {/* Teacher */}
        <Stack.Screen
          name="TeacherDashboard"
          component={TeacherDashboard}
          options={{ title: "Teacher Dashboard" }}
        />

        {/* Student */}
        <Stack.Screen
          name="StudentDashboard"
          component={StudentDashboard}
          options={{ title: "Student Dashboard" }}
        />

        {/* Attendance Records
            Receives optional { rollNo } param:
            - rollNo present → student sees own records
            - rollNo absent  → teacher sees all records */}
        <Stack.Screen
          name="Attendance Records"
          component={AttendanceList}
          options={({ route }) => ({
            title: route.params?.rollNo
              ? `Records — ${route.params.rollNo}`
              : "All Attendance Records",
          })}
        />

        {/* Network Status */}
        <Stack.Screen
          name="Network Status"
          component={NetworkStatus}
          options={{ title: "Network Status" }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}