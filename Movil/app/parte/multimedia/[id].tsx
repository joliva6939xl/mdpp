// Archivo: Movil/app/parte/multimedia/[id].tsx
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
  FlatList,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ViewToken,
} from "react-native";
// Importante: Stack para la navegación y useLocalSearchParams para el ID
import { useLocalSearchParams, Stack } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { obtenerSesion } from "../../../utils/session";
import { useAlert } from "../../../context/GlobalAlert";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:4000/api"
    : "http://10.0.2.2:4000/api";

const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:4000"
    : "http://10.0.2.2:4000";

export default function MultimediaScreen() {
  const { id } = useLocalSearchParams();
  const { showAlert } = useAlert();
  
  const { width, height } = useWindowDimensions();
  // Aumentamos un poco la altura disponible para asegurar que quepan los controles
  const containerHeight = height * 0.55;

  const [loading, setLoading] = useState(true);
  const [fotos, setFotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [tab, setTab] = useState<"fotos" | "videos">("fotos");

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<any[]>([]);

  useEffect(() => {
    const cargarMultimedia = async () => {
      try {
        const session = await obtenerSesion();
        if (!session) return;

        const response = await fetch(`${API_URL}/partes/${id}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const data = await response.json();

        if (response.ok) {
          setFotos(data.data.fotos || []);
          setVideos(data.data.videos || []);
          
          if ((!data.data.fotos || data.data.fotos.length === 0) && data.data.videos?.length > 0) {
            setTab("videos");
          }
        } else {
          showAlert({ title: "Error", message: "No se pudo cargar multimedia", type: "error" });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarMultimedia();
  }, [id, showAlert]);

  useEffect(() => {
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab]);

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ animated: true, index: index });
  };

  const goPrev = () => {
    if (currentIndex > 0) scrollToIndex(currentIndex - 1);
  };

  const goNext = () => {
    const currentData = tab === 'fotos' ? fotos : videos;
    if (currentIndex < currentData.length - 1) scrollToIndex(currentIndex + 1);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderFoto = ({ item }: { item: string }) => (
    <View style={{ width: width, height: containerHeight, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={{ uri: `${BASE_URL}/uploads/${item}` }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );

  const renderVideo = ({ item, index }: { item: string; index: number }) => {
    // LÓGICA DE PROPORCIÓN 16:9 PARA QUE LOS CONTROLES SE VEAN BIEN
    const maxW = width > 800 ? 800 : width; // Ancho máximo
    const idealH = maxW * (9 / 16); // Altura ideal 16:9
    
    // Si la altura ideal es más grande que el contenedor, ajustamos
    const videoHeight = idealH > containerHeight ? containerHeight : idealH;
    const videoWidth = idealH > containerHeight ? containerHeight * (16 / 9) : maxW;

    return (
      <View style={{ width: width, height: containerHeight, justifyContent: "center", alignItems: "center" }}>
         <View style={[styles.videoWrapper, { width: videoWidth, height: videoHeight }]}>
            <Text style={styles.videoLabel}>Video #{index + 1}</Text>
            <Video
                ref={(component: any) => { videoRefs.current[index] = component; }}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: "#000"
                }}
                source={{ uri: `${BASE_URL}/uploads/${item}` }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
            />
         </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const currentData = tab === 'fotos' ? fotos : videos;
  const showArrows = currentData.length > 1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === currentData.length - 1;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Galería de Evidencias",
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
        }}
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "fotos" && styles.activeTab]}
          onPress={() => setTab("fotos")}
        >
          <Text style={[styles.tabText, tab === "fotos" && styles.activeTabText]}>
            FOTOS ({fotos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "videos" && styles.activeTab]}
          onPress={() => setTab("videos")}
        >
          <Text style={[styles.tabText, tab === "videos" && styles.activeTabText]}>
            VIDEOS ({videos.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {currentData.length > 0 ? (
          <>
            <View style={{ height: containerHeight, width: '100%', justifyContent: 'center' }}>
                
                <FlatList
                    ref={flatListRef}
                    data={currentData}
                    keyExtractor={(item, index) => `${tab}-${index}`}
                    renderItem={tab === 'fotos' ? renderFoto : renderVideo}
                    pagingEnabled
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    contentContainerStyle={{ flexGrow: 1 }} 
                    style={{ flex: 1 }}
                    getItemLayout={(data, index) => (
                        {length: width, offset: width * index, index}
                    )}
                />

                {/* FLECHAS SIEMPRE VISIBLES (Disabled visualmente si no aplican) */}
                {showArrows && (
                  <>
                    <TouchableOpacity 
                        style={[
                            styles.arrowButton, 
                            styles.arrowLeft,
                            isFirst && styles.arrowDisabled
                        ]} 
                        onPress={goPrev}
                        disabled={isFirst}
                        activeOpacity={0.7}
                    >
                        <IconSymbol 
                            name="chevron.left" 
                            size={36} 
                            color={isFirst ? "rgba(255,255,255,0.2)" : "#fff"} 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.arrowButton, 
                            styles.arrowRight,
                            isLast && styles.arrowDisabled
                        ]} 
                        onPress={goNext}
                        disabled={isLast}
                        activeOpacity={0.7}
                    >
                        <IconSymbol 
                            name="chevron.right" 
                            size={36} 
                            color={isLast ? "rgba(255,255,255,0.2)" : "#fff"} 
                        />
                    </TouchableOpacity>
                  </>
                )}
            </View>

            <View style={styles.paginator}>
               <Text style={styles.paginatorText}>{currentIndex + 1} / {currentData.length}</Text>
            </View>
          </>
        ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay {tab === 'fotos' ? 'fotografías' : 'videos'} adjuntos.</Text>
            </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  
  tabs: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#38bdf8",
  },
  tabText: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 13,
  },
  activeTabText: {
    color: "#fff",
  },

  content: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center",
    width: '100%',
  },

  videoWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000', // Fondo negro para evitar bordes blancos
  },
  videoLabel: {
    color: "#fff",
    padding: 5,
    fontWeight: "bold",
    alignSelf: "flex-start",
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
  },

  arrowButton: {
      position: 'absolute',
      top: '50%',
      marginTop: -25, 
      backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fondo sólido para visibilidad
      width: 50,
      height: 50,
      borderRadius: 25,
      zIndex: 999,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
  },
  arrowDisabled: {
      backgroundColor: 'rgba(50,50,50,0.3)', // Se ve pero apagado
      opacity: 0.6, 
  },
  arrowLeft: {
      left: 15,
  },
  arrowRight: {
      right: 15,
  },
  paginator: {
      marginTop: 20,
      alignSelf: 'center',
      backgroundColor: 'rgba(50, 50, 50, 0.8)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20
  },
  paginatorText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14
  }
});