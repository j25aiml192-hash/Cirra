import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MobileHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Spend Widget Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>TOTAL SPEND (MTD)</Text>
        <Text style={styles.heroAmount}>$42,850.25</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+14.2% vs last month</Text>
        </View>
        <Text style={styles.subtext}>Projected $61,400 at month-end based on active burn rate</Text>
      </View>

      {/* Cloud vs AI Split */}
      <View style={styles.row}>
        <View style={[styles.card, styles.splitCard]}>
          <Text style={styles.cardLabel}>CLOUD INFRA</Text>
          <Text style={styles.splitAmount}>$33,120</Text>
          <Text style={styles.subtext}>AWS, GCP, Azure</Text>
        </View>

        <View style={[styles.card, styles.splitCard]}>
          <Text style={styles.cardLabel}>AI & LLMS</Text>
          <Text style={styles.splitAmount}>$9,730</Text>
          <Text style={styles.subtext}>OpenAI, Anthropic</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      </View>

      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Review 3 Active Sentinel Anomalies</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    padding: 16,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f293d",
  },
  cardLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroAmount: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    marginVertical: 8,
  },
  badge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  badgeText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "600",
  },
  subtext: {
    color: "#64748b",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  splitCard: {
    flex: 1,
  },
  splitAmount: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 4,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});
