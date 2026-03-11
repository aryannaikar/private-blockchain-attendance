import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import { SERVER_API } from "../../config/api";

export default function ManageUsers({ navigation }) {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !rollNo.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await SERVER_API.post("/auth/register-student", {
        name: name.trim(),
        rollNo: rollNo.trim().toUpperCase(),
        password: password.trim(),
      });
      alert(`✅ Student "${name}" (${rollNo.toUpperCase()}) registered successfully.`);
      setName("");
      setRollNo("");
      setPassword("");
    } catch (error) {
      const msg = error?.response?.data?.error || "Failed to create student";
      alert("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      <Text style={styles.sub}>Register new students and manage blockchain access.</Text>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Register New Student</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name (e.g. John Doe)"
          value={name}
          onChangeText={setName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Roll Number (e.g. STU002)"
          value={rollNo}
          onChangeText={setRollNo}
          autoCapitalize="characters"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Initial Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <View style={styles.btn}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Button title="Register Student" onPress={handleRegister} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  sub:       { fontSize: 15, color: "#555", marginBottom: 20 },
  formCard: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  btn: { marginTop: 8 },
});
