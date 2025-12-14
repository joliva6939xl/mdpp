// web/src/components/CallCenterDashboard.styles.ts
import type { CSSProperties } from "react";

export const ccdStyles = {
  layoutWrap: {
    width: "100%",
    minHeight: "calc(100vh - 120px)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  } as CSSProperties,

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    padding: "10px 12px",
  } as CSSProperties,

  panelCallCenter: {
    width: "680px",
    maxWidth: "100%",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "18px 22px",
  } as CSSProperties,

  internalCard: {
    minWidth: "280px",
    maxWidth: "360px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "12px 14px",
  } as CSSProperties,

  midArea: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "0 12px",
  } as CSSProperties,

  conteoWrap: {
    width: "min(1200px, 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    alignItems: "center",
  } as CSSProperties,

  zonesRow: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "28px",
    alignItems: "start",
  } as CSSProperties,

  zoneCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "16px",
    minHeight: "320px",
  } as CSSProperties,

  zoneTitle: {
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "0.6px",
    color: "#0f172a",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  } as CSSProperties,

  totalBar: {
    width: "min(1200px, 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "14px 16px",
  } as CSSProperties,

  btnRow: {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
    justifyContent: "center",
    flexWrap: "wrap",
  } as CSSProperties,

  bigTabs: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "10px",
  } as CSSProperties,

  tabBtn: (active: boolean): CSSProperties => ({
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: active ? "#2f6fed" : "#f3f4f6",
    color: active ? "#fff" : "#111827",
    fontWeight: 800,
    cursor: "pointer",
  }),

  smallBtn: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: 700,
  } as CSSProperties,

  darkBtn: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  } as CSSProperties,

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    marginBottom: "8px",
    fontSize: "13px",
  } as CSSProperties,

  statGrid: {
    width: "min(1200px, 100%)",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  } as CSSProperties,

  statCard: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: 14,
    border: "1px solid #e5e7eb",
  } as CSSProperties,

  statTitle: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    marginBottom: 8,
  } as CSSProperties,

  statValue: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
  } as CSSProperties,

  metricPanel: {
    width: "min(1200px, 100%)",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "16px",
  } as CSSProperties,

  metricHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  } as CSSProperties,

  top5Grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
  } as CSSProperties,

  top5Card: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
  } as CSSProperties,

  top5Title: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 900,
  } as CSSProperties,

  top5Incidencia: {
    marginTop: 8,
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 800,
    minHeight: 34,
  } as CSSProperties,

  top5Total: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 900,
  } as CSSProperties,

  errorBox: {
    width: "min(1200px, 100%)",
    background: "#fff",
    borderRadius: "16px",
    padding: "14px 16px",
    border: "1px solid #fecaca",
    color: "#991b1b",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  } as CSSProperties,

  barOuter: (height: number): CSSProperties => ({
    width: "100%",
    height,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
    border: "1px solid #d1d5db",
  }),

  barInner: (pct: number): CSSProperties => ({
    height: "100%",
    width: `${pct}%`,
    background: "#0f172a",
    borderRadius: 999,
    transition: "width 250ms ease",
  }),

  select: {
    marginLeft: 8,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontWeight: 800,
  } as CSSProperties,

  // ──────────────────────────────
  // ✅ NUEVO: Vista "VER USUARIOS"
  // ──────────────────────────────
  usersPanel: {
    width: "min(1200px, 100%)",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "16px",
  } as CSSProperties,

  usersHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  } as CSSProperties,

  usersTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  } as CSSProperties,

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  } as CSSProperties,

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    minWidth: 260,
    fontWeight: 700,
  } as CSSProperties,

  pillsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  } as CSSProperties,

  pill: (active: boolean): CSSProperties => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: active ? "#0f172a" : "#f8fafc",
    color: active ? "#fff" : "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  }),

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
  } as CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  } as CSSProperties,

  th: {
    textAlign: "left",
    padding: "10px 12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as CSSProperties,

  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    whiteSpace: "nowrap",
  } as CSSProperties,

  row: {
    cursor: "pointer",
  } as CSSProperties,
};
