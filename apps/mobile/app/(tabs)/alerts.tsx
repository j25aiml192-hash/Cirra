import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MobileAlert {
  id: string;
  title: string;
  service: string;
  spike: string;
  severity: "critical" | "warning";
  timestamp: string;
}

const mockAlerts: MobileAlert[] = [
  {
    id: "1",
    title: "OpenAI GPT-4o Token Spike",
    service: "Search & Recs API Key",
    spike: "+185% vs MAD baseline",
    severity: "critical",
    timestamp: "12m ago",
  },
  {
    id: "2",
    title: "AWS NAT Gateway Egress Jump",
    service: "vpc-prod-us-east-1",
    spike: "+64% vs 30d baseline",
    severity: "warning",
    timestamp: "2h ago",
  },
];

export default function MobileAlertsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text
                style={[
                  styles.severityTag,
                  item.severity === "critical" ? styles.criticalTag : styles.warningTag,
                ]}
              >
                {item.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.serviceText}>{item.service}</Text>
            <View style={styles.alertFooter}>
              <Text style={styles.spikeText}>{item.spike}</Text>
              <Text style={styles.timeText}>{item.timestamp}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    padding: 16,
  },
  alertCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f293d",
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  severityTag: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  criticalTag: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#f87171",
  },
  warningTag: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    color: "#fbbf24",
  },
  serviceText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 6,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 8,
  },
  spikeText: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "600",
  },
  timeText: {
    color: "#64748b",
    fontSize: 12,
  },
});
