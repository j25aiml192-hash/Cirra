import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function MobileSettingsScreen() {
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(true);
  const [pushEnabled, setPushEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SECURITY & NOTIFICATIONS</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Biometric FaceID / TouchID</Text>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: "#334155", true: "#4f46e5" }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push Alerts on Critical Anomaly</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: "#334155", true: "#4f46e5" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SESSION</Text>
        <TouchableOpacity style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out from Mobile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    padding: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1f293d",
  },
  rowLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "600",
  },
});
