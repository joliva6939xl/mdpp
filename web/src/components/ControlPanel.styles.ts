/* eslint-disable @typescript-eslint/no-explicit-any */
// web/src/components/ControlPanel.styles.ts

export const styles: any = {
  container: {
    width: "100%",
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "24px 24px 32px",
    borderRadius: "24px",
    background: "#020617",
    boxShadow:
      "0 18px 45px rgba(15,23,42,0.65), 0 0 0 1px rgba(15,23,42,0.9)",
    border: "1px solid #1f2937",
    color: "#e5e7eb",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },

  title: {
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    margin: 0,
    color: "#ffffff",
  },

  subtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#9ca3af",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },

  searchInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "999px",
    border: "1px solid #1f2937",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    fontSize: "14px",
    outline: "none",
    boxShadow: "0 0 0 1px rgba(15,23,42,0.7)",
  },

  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    color: "#6b7280",
  },

  selectionRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "16px",
    border: "1px solid #1f2937",
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.25) 0, transparent 55%), rgba(15,23,42,0.95)",
    marginBottom: "16px",
  },

  selectionLeft: {
    fontSize: "14px",
    color: "#9ca3af",
  },

  selectionRight: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  massActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "flex-end",
    marginBottom: "18px",
  },

  adminPanelToggle: {
    marginTop: "8px",
    marginBottom: "12px",
    display: "flex",
    justifyContent: "flex-start",
  },

  adminPanel: {
    borderRadius: "18px",
    padding: "16px 18px",
    border: "1px dashed #334155",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.96))",
    marginBottom: "14px",
  },

  adminTitle: {
    margin: "0 0 4px 0",
    fontSize: "15px",
    fontWeight: 600,
    color: "#e5e7eb",
  },

  adminSubtitle: {
    margin: "0 0 10px 0",
    fontSize: "13px",
    color: "#9ca3af",
  },

  adminActionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  // 💫 Animaciones elegantes para mostrar/ocultar paneles
  adminPanelVisible: {
    maxHeight: 500,
    opacity: 1,
    transform: "translateY(0)",
    marginBottom: "14px",
    transition:
      "max-height 0.35s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.3s ease, transform 0.3s ease, margin-bottom 0.3s ease, padding 0.3s ease",
  },

  adminPanelHidden: {
    maxHeight: 0,
    opacity: 0,
    transform: "translateY(-8px)",
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: "hidden",
    pointerEvents: "none",
    transition:
      "max-height 0.35s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.25s ease, transform 0.25s ease, margin-bottom 0.25s ease, padding 0.25s ease",
  },

  createUserPanelBase: {
    marginTop: "6px",
    borderRadius: "18px",
    border: "1px solid #334155",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.16) 0, transparent 55%), rgba(15,23,42,0.98)",
  },

  createUserPanelVisible: {
    maxHeight: 800,
    opacity: 1,
    transform: "translateY(0)",
    padding: "16px 18px 18px",
    marginTop: "10px",
    overflow: "hidden",
    transition:
      "max-height 0.4s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.35s ease, transform 0.35s ease, padding 0.35s ease, margin-top 0.35s ease",
  },

  createUserPanelHidden: {
    maxHeight: 0,
    opacity: 0,
    transform: "translateY(-10px)",
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    overflow: "hidden",
    pointerEvents: "none",
    transition:
      "max-height 0.35s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.25s ease, transform 0.25s ease, padding 0.25s ease, margin-top 0.25s ease",
  },

  createTitle: {
    margin: "0 0 10px 0",
    fontSize: "15px",
    fontWeight: 600,
    color: "#e5e7eb",
  },

  createTabs: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#020617",
    borderRadius: "999px",
    padding: "3px",
    border: "1px solid #1f2937",
    marginBottom: "14px",
    gap: "4px",
  },

  createForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  createRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
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
    fontWeight: 500,
    color: "#9ca3af",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },

  createInput: {
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid #1f2937",
    backgroundColor: "#020617",
    color: "#e5e7eb",
    fontSize: "13px",
    outline: "none",
    boxShadow: "0 0 0 1px rgba(15,23,42,0.85)",
  },

  smallInfo: {
    fontSize: "11px",
    color: "#6b7280",
    marginLeft: "6px",
  },

  checkboxRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "4px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#9ca3af",
  },

  createActions: {
    marginTop: "4px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  baseButton: {
    border: "none",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition:
      "background-color 0.18s ease, color 0.18s ease, transform 0.08s ease, box-shadow 0.18s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    backgroundColor: "transparent",
    color: "#9ca3af",
    boxShadow: "0 0 0 1px rgba(15,23,42,0.7)",
  },

  btnBack: {
    background:
      "linear-gradient(135deg, rgba(15,23,42,1), rgba(15,23,42,0.95))",
    color: "#9ca3af",
  },

  btnLogout: {
    background:
      "linear-gradient(135deg, rgba(127,29,29,0.95), rgba(185,28,28,0.98))",
    color: "#fee2e2",
    boxShadow: "0 10px 25px rgba(127,29,29,0.65)",
  },

  btnSearch: {
    background:
      "linear-gradient(135deg, rgba(30,64,175,0.95), rgba(37,99,235,0.98))",
    color: "#eff6ff",
    fontWeight: 500,
  },

  btnUserTarget: {
    backgroundColor: "#020617",
    color: "#9ca3af",
    border: "1px solid #1f2937",
  },

  btnUserTargetActive: {
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,1))",
    color: "#f9fafb",
    boxShadow: "0 10px 25px rgba(37,99,235,0.65)",
    border: "1px solid rgba(191,219,254,0.8)",
  },

  btnSecondary: {
    backgroundColor: "#020617",
    color: "#9ca3af",
    border: "1px solid #1f2937",
  },

  btnPrimary: {
    background:
      "linear-gradient(135deg, rgba(22,163,74,0.95), rgba(34,197,94,1))",
    color: "#ecfdf5",
    boxShadow: "0 10px 25px rgba(22,163,74,0.6)",
    border: "1px solid rgba(187,247,208,0.9)",
  },

  btnWarning: {
    background:
      "linear-gradient(135deg, rgba(194,65,12,0.96), rgba(249,115,22,1))",
    color: "#fff7ed",
    boxShadow: "0 10px 25px rgba(194,65,12,0.65)",
    border: "1px solid rgba(254,215,170,0.9)",
  },

  btnDanger: {
    background:
      "linear-gradient(135deg, rgba(185,28,28,0.97), rgba(239,68,68,1))",
    color: "#fef2f2",
    boxShadow: "0 10px 25px rgba(185,28,28,0.65)",
    border: "1px solid rgba(254,202,202,0.95)",
  },

  btnUnblock: {
    background:
      "linear-gradient(135deg, rgba(6,95,70,0.96), rgba(16,185,129,1))",
    color: "#ecfdf5",
    border: "1px solid rgba(167,243,208,0.9)",
    boxShadow: "0 10px 24px rgba(4,120,87,0.6)",
  },

  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
    boxShadow: "none",
    filter: "grayscale(0.4)",
  },

  btnAdminToggle: {
    backgroundColor: "#020617",
    color: "#9ca3af",
    border: "1px solid #1f2937",
  },

  btnCreate: {
    background:
      "linear-gradient(135deg, rgba(30,64,175,0.95), rgba(59,130,246,1))",
    color: "#eff6ff",
    boxShadow: "0 10px 24px rgba(37,99,235,0.6)",
    border: "1px solid rgba(191,219,254,0.95)",
  },

  btnCancel: {
    backgroundColor: "#020617",
    color: "#6b7280",
    border: "1px solid #1f2937",
  },

  tabActive: {
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.96), rgba(59,130,246,1))",
    color: "#eff6ff",
    boxShadow: "0 8px 18px rgba(37,99,235,0.55)",
  },

  tabInactive: {
    backgroundColor: "#020617",
    color: "#6b7280",
    border: "1px solid #1f2937",
  },

      detailsContainer: {
      maxWidth: "720px",
      margin: "0 auto",
      background: "linear-gradient(135deg,#f9fafb,#eef2ff)",
      borderRadius: 16,
      padding: "18px 20px 20px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
      boxSizing: "border-box",
    },
    detailsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "1rem",
      marginBottom: "1rem",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "0.75rem",
    },
    detailsHeaderName: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#111827",
      marginBottom: "0.25rem",
    },
    detailsHeaderTag: {
      fontSize: "0.8rem",
      color: "#4b5563",
    },
    detailsHeaderChip: {
      padding: "3px 9px",
      borderRadius: 999,
      fontSize: "0.7rem",
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
      fontWeight: 500,
      border: "1px solid #bae6fd",
      whiteSpace: "nowrap",
    },
    detailsBody: {
      display: "flex",
      gap: "1.25rem",
      alignItems: "flex-start",
      flexWrap: "wrap",
    },
    detailsLeft: {
      flex: 1,
      minWidth: "230px",
    },
    detailsSection: {
      marginBottom: "0.75rem",
    },
    detailsSectionTitle: {
      fontSize: "0.8rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "#6b7280",
      marginBottom: "0.35rem",
    },
    detailsRow: {
      display: "flex",
      gap: "0.4rem",
      marginBottom: "0.2rem",
      fontSize: "0.82rem",
      color: "#374151",
    },
    detailsLabel: {
      minWidth: "110px",
      fontWeight: 600,
      color: "#4b5563",
    },
    detailsPhotoWrapper: {
      width: "150px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.45rem",
    },
    detailsAvatar: {
      width: "110px",
      height: "110px",
      borderRadius: "50%",
      objectFit: "cover",
      border: "2px solid #2563eb",
      boxShadow: "0 4px 10px rgba(37,99,235,0.35)",
      backgroundColor: "#e5e7eb",
    },
    detailsAvatarPlaceholder: {
      width: "110px",
      height: "110px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px dashed #9ca3af",
      color: "#6b7280",
      fontSize: "0.75rem",
      backgroundColor: "#f9fafb",
    },
    detailsPhotoLabel: {
      fontSize: "0.78rem",
      color: "#4b5563",
      textAlign: "center",
    },

};
