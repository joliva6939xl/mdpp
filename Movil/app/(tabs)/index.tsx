// Archivo: app/(tabs)/index.tsx
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Button,
} from "react-native";
import { useState } from "react";
import { addParte } from "../utils/parteCache";

export default function NuevoParteScreen() {
  const [sector, setSector] = useState("");
  const [parteFisico, setParteFisico] = useState("");
  const [zona, setZona] = useState("");
  const [turno, setTurno] = useState("");
  const [lugar, setLugar] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const [unidadTipo, setUnidadTipo] = useState(""); // OMEGA o ALFA o "SELECCIONAR"
  const [unidadNumero, setUnidadNumero] = useState(""); // número de unidad

  const [placa, setPlaca] = useState("");
  const [conductor, setConductor] = useState("");
  const [dniConductor, setDniConductor] = useState("");

  const [sumilla, setSumilla] = useState("");
  const [asunto, setAsunto] = useState("");
  const [ocurrencia, setOcurrencia] = useState("");

  const [supZonal, setSupZonal] = useState("");
  const [supGeneral, setSupGeneral] = useState("");

  const generarListaUnidades = () => {
    if (unidadTipo === "OMEGA") return [...Array(50)].map((_, i) => `${i + 1}`);
    if (unidadTipo === "ALFA") return [...Array(80)].map((_, i) => `${i + 1}`);
    return [];
  };

  const limpiarFormulario = () => {
    setSector("");
    setParteFisico("");
    setZona("");
    setTurno("");
    setLugar("");
    setFecha("");
    setHora("");
    setUnidadTipo("");
    setUnidadNumero("");
    setPlaca("");
    setConductor("");
    setDniConductor("");
    setSumilla("");
    setAsunto("");
    setOcurrencia("");
    setSupZonal("");
    setSupGeneral("");
  };

  const handleGuardar = () => {
    const parte = addParte({
      sector,
      parteFisico,
      zona,
      turno,
      lugar,
      fecha,
      hora,
      unidadTipo: unidadTipo === "SELECCIONAR" ? "" : unidadTipo,
      unidadNumero,
      placa,
      conductor,
      dniConductor,
      sumilla,
      asunto,
      ocurrencia,
      supZonal,
      supGeneral,
    });

    alert(`Parte virtual #${parte.id} guardado en memoria temporal (desarrollo).`);

    limpiarFormulario();
  };

  return (
    <ScrollView style={styles.container}>
      {/* ENCABEZADO */}
      <Text style={styles.header}>SEGURIDAD CIUDADANA</Text>
      <Text style={styles.header}>MUNICIPALIDAD DE PUENTE PIEDRA</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Sector:</Text>
        <TextInput style={styles.input} value={sector} onChangeText={setSector} />

        <Text style={styles.label}>N° de Parte Físico:</Text>
        <TextInput style={styles.input} value={parteFisico} onChangeText={setParteFisico} />

        <Text style={styles.label}>Zona:</Text>
        <TextInput style={styles.input} value={zona} onChangeText={setZona} />

        <Text style={styles.label}>Turno:</Text>
        <TextInput style={styles.input} value={turno} onChangeText={setTurno} />

        <Text style={styles.label}>Lugar:</Text>
        <TextInput style={styles.input} value={lugar} onChangeText={setLugar} />

        <Text style={styles.label}>Fecha:</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          value={fecha}
          onChangeText={setFecha}
        />

        <Text style={styles.label}>Hora:</Text>
        <TextInput
          style={styles.input}
          placeholder="HH:MM"
          value={hora}
          onChangeText={setHora}
        />

        {/* UNIDAD */}
        <Text style={styles.label}>Unidad:</Text>

        <TouchableOpacity
          style={styles.selectorUnidad}
          onPress={() => {
            setUnidadTipo(unidadTipo === "" ? "SELECCIONAR" : "");
            setUnidadNumero("");
          }}
        >
          <Text style={styles.selectorText}>
            {unidadTipo === "" || unidadTipo === "SELECCIONAR"
              ? "Seleccionar unidad"
              : `${unidadTipo} ${unidadNumero}`}
          </Text>
        </TouchableOpacity>

        {unidadTipo === "SELECCIONAR" && (
          <View style={styles.unidadOptions}>
            <TouchableOpacity
              style={styles.optionUnidad}
              onPress={() => {
                setUnidadTipo("OMEGA");
                setUnidadNumero("");
              }}
            >
              <Text>OMEGA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionUnidad}
              onPress={() => {
                setUnidadTipo("ALFA");
                setUnidadNumero("");
              }}
            >
              <Text>ALFA</Text>
            </TouchableOpacity>
          </View>
        )}

        {(unidadTipo === "OMEGA" || unidadTipo === "ALFA") && (
          <View style={styles.rowWrap}>
            {generarListaUnidades().map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.unidadNumero,
                  unidadNumero === num && styles.unidadSeleccionada,
                ]}
                onPress={() => setUnidadNumero(num)}
              >
                <Text style={styles.unidadNumeroTexto}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Placa:</Text>
        <TextInput style={styles.input} value={placa} onChangeText={setPlaca} />

        <Text style={styles.label}>Conductor:</Text>
        <TextInput style={styles.input} value={conductor} onChangeText={setConductor} />

        <Text style={styles.label}>DNI del Conductor:</Text>
        <TextInput
          style={styles.input}
          value={dniConductor}
          onChangeText={setDniConductor}
        />

        <View style={styles.separator} />

        <Text style={styles.label}>Sumilla:</Text>
        <TextInput style={styles.input} value={sumilla} onChangeText={setSumilla} />

        <Text style={styles.label}>Asunto:</Text>
        <TextInput style={styles.input} value={asunto} onChangeText={setAsunto} />

        <View style={styles.separator} />

        <Text style={styles.label}>Ocurrencia:</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={ocurrencia}
          onChangeText={setOcurrencia}
        />

        <View style={styles.separator} />

        <Text style={styles.label}>JEFE DE OPERACIONES:</Text>
        <Text style={styles.staticValue}>MORI TRIGOSO</Text>

        <Text style={styles.label}>Supervisor Zonal:</Text>
        <TextInput style={styles.input} value={supZonal} onChangeText={setSupZonal} />

        <Text style={styles.label}>Supervisor General:</Text>
        <TextInput
          style={styles.input}
          value={supGeneral}
          onChangeText={setSupGeneral}
        />
      </View>

      <Button title="Seleccionar Fotos (solo móvil)" disabled />
      <Button title="Seleccionar Videos (solo móvil)" disabled />

      <View style={{ height: 15 }} />

      <TouchableOpacity style={styles.btnGuardar} onPress={handleGuardar}>
        <Text style={styles.btnGuardarTexto}>GUARDAR PARTE</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 2 },
  label: { marginTop: 10, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#777",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
  },
  section: { marginBottom: 20 },
  separator: {
    height: 2,
    backgroundColor: "#ccc",
    marginVertical: 15,
  },
  textArea: {
    borderWidth: 1,
    height: 100,
    padding: 8,
    borderRadius: 5,
    borderColor: "#777",
  },
  selectorUnidad: {
    borderWidth: 1,
    borderColor: "#777",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#f3f3f3",
  },
  selectorText: { fontSize: 16 },
  unidadOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  optionUnidad: {
    borderWidth: 1,
    borderColor: "#777",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  unidadNumero: {
    width: 40,
    height: 40,
    margin: 5,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  unidadSeleccionada: {
    backgroundColor: "#007bff",
    borderColor: "#0056b3",
  },
  unidadNumeroTexto: { color: "black" },
  staticValue: { fontSize: 16, paddingTop: 4 },
  btnGuardar: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  btnGuardarTexto: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
