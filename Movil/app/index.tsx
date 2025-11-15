// Archivo: app/index.tsx
import { Redirect } from "expo-router";

export default function RootIndex() {
  // Siempre que entren a http://localhost:8081 los mandamos al login
  return <Redirect href={"/login" as any} />;
}