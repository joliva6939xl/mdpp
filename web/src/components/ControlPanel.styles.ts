// web/src/components/ControlPanel.styles.ts
import React from "react";

export const styles: { [key: string]: React.CSSProperties } = {
  container: {
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "12px",
    marginBottom: "16px",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  userInfo: {
    fontSize: "0.9rem",
  },
  userNameHighlight: {
    fontWeight: "bold",
    color: "#1976d2",
  },
  headerButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  navButton: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  btnBack: {
    backgroundColor: "#e0e0e0",
  },
  btnLogout: {
    backgroundColor: "#e53935",
    color: "#fff",
  },
  searchRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  searchInput: {
    flex: 1,
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "0.9rem",
  },
  toggleRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  baseButton: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  btnSearch: {
    backgroundColor: "#1976d2",
    color: "#fff",
  },
  btnUserTarget: {
    backgroundColor: "#f5f5f5",
  },
  btnUserTargetActive: {
    backgroundColor: "#1976d2",
    color: "#fff",
  },
  btnCreate: {
    backgroundColor: "#26a69a",
    color: "#fff",
  },
  btnBlock: {
    backgroundColor: "#ffb300",
    color: "#000",
  },
  btnUnblock: {
    backgroundColor: "#64b5f6",
    color: "#000",
  },
  btnPrimary: {
    backgroundColor: "#1976d2",
    color: "#fff",
  },
  btnDanger: {
    backgroundColor: "#e53935",
    color: "#fff",
  },
  btnStat: {
    backgroundColor: "#43a047",
    color: "#fff",
  },
  selectionInfo: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "12px",
    fontSize: "0.9rem",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  adminPanelToggle: {
    marginTop: "8px",
    marginBottom: "8px",
  },
  btnAdminToggle: {
    backgroundColor: "#8e24aa",
    color: "#fff",
  },
  adminPanelTitle: {
    marginBottom: "8px",
  },
  createUserCard: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px",
    backgroundColor: "#fff",
    marginBottom: "12px",
  },
  createRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "8px",
  },
  createField: {
    flex: 1,
    minWidth: "180px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  createLabel: {
    fontSize: "12px",
    fontWeight: 600,
  },
  createInput: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "13px",
  },
  createSelect: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "13px",
    backgroundColor: "#fff",
  },
  smallInfo: {
    fontSize: "11px",
    fontWeight: 400,
    marginLeft: "4px",
    color: "#555",
  },
  checkboxRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  checkboxLabel: {
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  createActionsRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "8px",
  },
};
