// File: src/components/Profile/slider/ActionDetailModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";

export interface Action {
  signature?: string;
  slot?: number | string;
  transactionType?: string;
  type?: string;
  instructions?: any[];
  description?: string;
  fee?: number;
  timestamp?: number;
  feePayer?: string;
  source?: string;
  events?: any[] | object;
  // ... any other properties you might need
}

export interface ActionDetailModalProps {
  visible: boolean;
  action: Action | null;
  onClose: () => void;
}

/**
 * Returns an accent color based on the action label.
 */
function getActionColor(actionLabel: string): string {
  const label = actionLabel.toLowerCase();
  if (label.includes("transfer")) {
    return "#1d9bf0"; // Blue for transfers
  } else if (label.includes("swap")) {
    return "#9c27b0"; // Purple for swaps
  } else if (label.includes("buy")) {
    return "#4caf50"; // Green for buys
  } else if (label.includes("sell")) {
    return "#f44336"; // Red for sells
  }
  return "#607d8b"; // Default blue-gray for unknown actions
}

const ActionDetailModal: React.FC<ActionDetailModalProps> = ({
  visible,
  action,
  onClose,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  
  if (!action) return null;

  // Determine the action label.
  let actionLabel = action.transactionType || action.type || "Unknown Action";
  if (
    (!actionLabel || actionLabel === "Unknown Action") &&
    action.instructions?.length
  ) {
    const firstInstruction = action.instructions[0];
    if (
      firstInstruction.program === "system" &&
      firstInstruction.parsed &&
      firstInstruction.parsed.type === "transfer"
    ) {
      actionLabel = "Transfer";
    } else if (
      firstInstruction.program === "token-mill" &&
      firstInstruction.parsed &&
      firstInstruction.parsed.type === "buy"
    ) {
      actionLabel = "Buy";
    } else if (
      firstInstruction.program === "token-mill" &&
      firstInstruction.parsed &&
      firstInstruction.parsed.type === "sell"
    ) {
      actionLabel = "Sell";
    }
  }

  const accentColor = getActionColor(actionLabel);
  const signature = action.signature || "UnknownSignature";
  const truncatedSignature =
    signature.length > 16 ? signature.slice(0, 8) + "..." + signature.slice(-6) : signature;
  const slot = action.slot || "—";
  const description = action.description || "No description available.";
  const fee = action.fee !== undefined ? action.fee : "N/A";

  // Format timestamp into separate date and time strings.
  let formattedDate = "N/A";
  let formattedTime = "N/A";
  if (action.timestamp) {
    const d = new Date(action.timestamp * 1000);
    formattedDate = d.toLocaleDateString();
    formattedTime = d.toLocaleTimeString();
  }

  // Build Solscan URL – adjust query parameters if needed.
  const solscanURL = `https://solscan.io/tx/${signature}`;

  const copySignature = () => {
    Clipboard.setString(signature);
  };

  const openSolscan = () => {
    Linking.openURL(solscanURL).catch((err) =>
      console.error("Failed to open Solscan:", err)
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={modalStyles.content}>
            {/* Basic Details */}
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Type:</Text>
              <Text style={[modalStyles.detailValue, { color: accentColor }]}>
                {actionLabel}
              </Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Description:</Text>
              <Text style={modalStyles.detailValue}>{description}</Text>
            </View>
            {/* Signature Row with copy icon */}
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Signature:</Text>
              <TouchableOpacity onPress={copySignature} style={modalStyles.copyIcon}>
                <Text style={modalStyles.copyIconText}>📋</Text>
              </TouchableOpacity>
              <Text style={modalStyles.detailValue}>{truncatedSignature}</Text>
            </View>
            {/* Solscan Button */}
            <TouchableOpacity onPress={openSolscan} style={modalStyles.solscanButton}>
              <Text style={modalStyles.solscanButtonText}>View on Solscan</Text>
            </TouchableOpacity>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Slot:</Text>
              <Text style={modalStyles.detailValue}>{slot}</Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Fee:</Text>
              <Text style={modalStyles.detailValue}>{fee}</Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Date:</Text>
              <Text style={modalStyles.detailValue}>{formattedDate}</Text>
            </View>
            <View style={modalStyles.detailRow}>
              <Text style={modalStyles.detailLabel}>Time:</Text>
              <Text style={modalStyles.detailValue}>{formattedTime}</Text>
            </View>
            {action.feePayer && (
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Fee Payer:</Text>
                <Text style={modalStyles.detailValue}>{action.feePayer}</Text>
              </View>
            )}
            {action.source && (
              <View style={modalStyles.detailRow}>
                <Text style={modalStyles.detailLabel}>Source:</Text>
                <Text style={modalStyles.detailValue}>{action.source}</Text>
              </View>
            )}
            {/* Instructions Dropdown */}
            {action.instructions && action.instructions.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={modalStyles.sectionTitle}>Instructions:</Text>
                {showInstructions ? (
                  action.instructions.map((instr, idx) => (
                    <View key={idx} style={modalStyles.instructionRow}>
                      <Text style={modalStyles.instructionText}>
                        {JSON.stringify(instr, null, 2)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={modalStyles.instructionRow}>
                    <Text style={modalStyles.instructionText}>
                      {JSON.stringify(action.instructions[0]).slice(0, 100)}...
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => setShowInstructions(!showInstructions)}
                  style={modalStyles.toggleContainer}
                >
                  <Text style={modalStyles.toggleText}>
                    {showInstructions ? "Show Less" : "Show More"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    backgroundColor: "#1d9bf0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: "600",
    width: 100,
  },
  detailValue: {
    flex: 1,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  instructionRow: {
    marginBottom: 6,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 6,
  },
  instructionText: {
    fontSize: 12,
    color: "#555",
  },
  toggleContainer: {
    alignSelf: "flex-end",
    padding: 4,
  },
  toggleText: {
    fontSize: 12,
    color: "#1d9bf0",
    fontWeight: "600",
  },
  copyIcon: {
    marginRight: 6,
  },
  copyIconText: {
    fontSize: 16,
  },
  solscanButton: {
    marginVertical: 8,
    backgroundColor: "#e8f4fd",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  solscanButtonText: {
    color: "#1d9bf0",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ActionDetailModal;
