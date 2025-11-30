// Movil/context/GlobalAlert.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type AlertType = "success" | "error" | "info";

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
};

type AlertContextType = {
  showAlert: (options: {
    title?: string;
    message: string;
    type?: AlertType;
  }) => void;
  hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = ({
    title = "Aviso",
    message,
    type = "info",
  }: {
    title?: string;
    message: string;
    type?: AlertType;
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const backgroundColor =
    alert.type === "success"
      ? "#16A34A"
      : alert.type === "error"
      ? "#DC2626"
      : "#2563EB";

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal visible={alert.visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            {alert.title ? (
              <Text style={styles.title}>{alert.title}</Text>
            ) : null}
            <Text style={styles.message}>{alert.message}</Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor }]}
              onPress={hideAlert}
            >
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error(
      "useAlert debe usarse dentro de un <AlertProvider>. Revisa app/_layout.tsx"
    );
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    color: "#111827",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    color: "#374151",
    marginBottom: 20,
  },
  button: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
