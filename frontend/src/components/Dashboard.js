import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import MapaComMarcadores from './MapaComMarcadores';
import GraficoDecibeis from './GraficoDecibeis';
import TabelaReferenciaDecibeis from './TabelaReferenciaDecibeis';
import PainelDeLogs from './PainelDeLogs'; // ✨ 1. Importe o novo componente

const LARGURA_PAINEL = '550px';

function MapResizer({ isSidebarOpen }) {
  const map = useMap();
  React.useEffect(() => {
    setTimeout(() => map.invalidateSize(), 300);
  }, [isSidebarOpen, map]);
  return null;
}

const Dashboard = () => {
  const [sensorSelecionado, setSensorSelecionado] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ✨ 2. Estado para controlar a aba ativa
  const [abaAtiva, setAbaAtiva] = useState('grafico'); // 'grafico' ou 'logs'

  const handleMarkerClick = (sensor) => {
    setSensorSelecionado(sensor);
    setAbaAtiva('grafico'); // Ao clicar no sensor, sempre mostra a aba do gráfico
    setIsSidebarOpen(true); 
  };
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const styles = {
    // ... (outros estilos como dashboardContainer, mapColumn, etc., continuam os mesmos)
    dashboardContainer: { position: 'relative', display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', fontFamily: 'sans-serif' },
    mapColumn: { height: '100%', width: isSidebarOpen ? `calc(100% - ${LARGURA_PAINEL})` : '100%', transition: 'width 0.3s ease-in-out', },
    sidebarColumn: { width: LARGURA_PAINEL, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: '#f0f2f5', transition: 'width 0.3s ease-in-out', flexShrink: 0, },
    toggleButton: { position: 'absolute', top: '15px', right: isSidebarOpen ? `calc(${LARGURA_PAINEL} + 15px)` : '15px', zIndex: 1000, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'right 0.3s ease-in-out', fontSize: '1.5em', },
    placeholder: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', backgroundColor: '#fff', borderRadius: '8px', color: '#888', textAlign: 'center', border: '2px dashed #ddd' },
    
    // ✨ 3. Estilos para as abas
    tabsContainer: {
      display: 'flex',
      borderBottom: '1px solid #ccc',
      marginBottom: '10px'
    },
    tabButton: {
      padding: '10px 20px',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '1em',
      color: '#555'
    },
    activeTab: {
      borderBottom: '3px solid #007bff',
      fontWeight: 'bold',
      color: '#007bff'
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <button onClick={toggleSidebar} style={styles.toggleButton} title={isSidebarOpen ? "Fechar Painel" : "Abrir Painel"}>
        {isSidebarOpen ? '»' : '«'}
      </button>

      <div style={styles.mapColumn}>
        <MapaComMarcadores onMarkerClick={handleMarkerClick}>
          <MapResizer isSidebarOpen={isSidebarOpen} />
        </MapaComMarcadores>
      </div>

      {isSidebarOpen && (
        <div style={styles.sidebarColumn}>
          {/* ✨ 4. Renderização das abas */}
          <div style={styles.tabsContainer}>
            <button 
              style={{...styles.tabButton, ...(abaAtiva === 'grafico' ? styles.activeTab : {})}}
              onClick={() => setAbaAtiva('grafico')}
            >
              Análise do Sensor
            </button>
            <button 
              style={{...styles.tabButton, ...(abaAtiva === 'logs' ? styles.activeTab : {})}}
              onClick={() => setAbaAtiva('logs')}
            >
              Histórico de Eventos
            </button>
          </div>

          {/* ✨ 5. Renderização do conteúdo da aba ativa */}
          {abaAtiva === 'grafico' && (
            <>
              {sensorSelecionado ? (
                <GraficoDecibeis sensor={sensorSelecionado} />
              ) : (
                <div style={styles.placeholder}>
                  <h3>Selecione um sensor no mapa para ver os detalhes</h3>
                </div>
              )}
              <TabelaReferenciaDecibeis />
            </>
          )}

          {abaAtiva === 'logs' && <PainelDeLogs />}
        </div>
      )}
    </div>
  );
};

export default Dashboard;