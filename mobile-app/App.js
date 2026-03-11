import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import "react-native-gesture-handler";

// Auth/Base Screens
import LandingScreen    from "./src/screens/Landing/LandingScreen";
import LoginScreen      from "./src/screens/Login/LoginScreen";
import NetworkStatus    from "./src/screens/NetworkStatus/NetworkStatus";
import NotFoundScreen   from "./src/screens/NotFound/NotFoundScreen";

// Role Screens
import AdminDashboard   from "./src/screens/AdminDashboard/AdminDashboard";
import ManageUsers      from "./src/screens/ManageUsers/ManageUsers";

import TeacherDashboard from "./src/screens/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "./src/screens/StudentDashboard/StudentDashboard";

// Shared
import AttendanceList   from "./src/screens/AttendanceList/AttendanceList";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// --- Auth Stack ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="NetworkStatus" component={NetworkStatus} />
    </Stack.Navigator>
  );
}

// --- Admin Drawer ---
function AdminDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Overview">
      <Drawer.Screen name="Overview" component={AdminDashboard} options={{ title: "Admin Portal" }} />
      <Drawer.Screen name="ManageUsers" component={ManageUsers} options={{ title: "Manage Students" }} />
      <Drawer.Screen name="AllAttendance" component={AttendanceList} options={{ title: "All Attendance" }} />
    </Drawer.Navigator>
  );
}

// --- Teacher Drawer ---
function TeacherDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Dashboard">
      <Drawer.Screen name="Dashboard" component={TeacherDashboard} options={{ title: "Teacher Portal" }} />
      <Drawer.Screen name="AllAttendance" component={AttendanceList} options={{ title: "View Attendance" }} />
      <Drawer.Screen name="NetworkStatus" component={NetworkStatus} options={{ title: "Network Diagnostics" }} />
    </Drawer.Navigator>
  );
}

// --- Student Drawer ---
function StudentDrawer({ route }) {
  // Pass the rollNo down so screens know who is logged in
  const rollNo = route.params?.rollNo || "Unknown";
  return (
    <Drawer.Navigator initialRouteName="Dashboard">
      <Drawer.Screen 
        name="Dashboard" 
        component={StudentDashboard} 
        initialParams={{ rollNo }}
        options={{ title: "Student Portal" }} 
      />
      <Drawer.Screen 
        name="MyAttendance" 
        component={AttendanceList} 
        initialParams={{ rollNo }}
        options={{ title: "My Attendance" }} 
      />
    </Drawer.Navigator>
  );
}

// --- Main App Root ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* The unauthenticated flow */}
        <Stack.Screen name="Auth" component={AuthStack} />
        
        {/* The authenticated flows (Drawers) */}
        <Stack.Screen name="AdminRoot" component={AdminDrawer} />
        <Stack.Screen name="TeacherRoot" component={TeacherDrawer} />
        <Stack.Screen name="StudentRoot" component={StudentDrawer} />

        {/* Fallback */}
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}