import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet'; // ✨ 1. Importe o hook useMap
import MapaComMarcadores from './MapaComMarcadores';
import GraficoDecibeis from './GraficoDecibeis';
import TabelaReferenciaDecibeis from './TabelaReferenciaDecibeis';

const LARGURA_PAINEL = '550px';

// ✨ 2. Crie o componente ajudante que vai cuidar do redimensionamento
function MapResizer({ isSidebarOpen }) {
  const map = useMap(); // Acessa a instância do mapa diretamente!

  useEffect(() => {
    // A lógica de redimensionamento agora vive aqui dentro
    setTimeout(() => {
      map.invalidateSize();
    }, 300); // Espera a animação do CSS
  }, [isSidebarOpen, map]);

  return null; // Este componente não renderiza nada visível
}


const Dashboard = () => {
  const [sensorSelecionado, setSensorSelecionado] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ✨ 3. A lógica antiga de 'mapInstance' foi REMOVIDA
  // const [mapInstance, setMapInstance] = useState(null);
  // O useEffect antigo também foi REMOVIDO.

  const handleMarkerClick = (sensor) => {
    setSensorSelecionado(sensor);
    setIsSidebarOpen(true); 
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const styles = {
    // ... (os estilos continuam os mesmos da versão anterior)
    dashboardContainer: { position: 'relative', display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', fontFamily: 'sans-serif' },
    mapColumn: { height: '100%', width: isSidebarOpen ? `calc(100% - ${LARGURA_PAINEL})` : '100%', transition: 'width 0.3s ease-in-out', },
    sidebarColumn: { width: LARGURA_PAINEL, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: '#f0f2f5', transition: 'width 0.3s ease-in-out', flexShrink: 0, },
    toggleButton: { position: 'absolute', top: '15px', right: isSidebarOpen ? `calc(${LARGURA_PAINEL} + 15px)` : '15px', zIndex: 1000, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'right 0.3s ease-in-out', fontSize: '1.5em', },
    placeholder: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', backgroundColor: '#fff', borderRadius: '8px', color: '#888', textAlign: 'center', border: '2px dashed #ddd' }
  };

  return (
    <div style={styles.dashboardContainer}>
      
      <button onClick={toggleSidebar} style={styles.toggleButton} title={isSidebarOpen ? "Fechar Painel" : "Abrir Painel"}>
        {isSidebarOpen ? '»' : '«'}
      </button>

      <div style={styles.mapColumn}>
        {/* ✨ 4. Passamos o MapResizer como filho do MapaComMarcadores */}
        <MapaComMarcadores onMarkerClick={handleMarkerClick}>
          <MapResizer isSidebarOpen={isSidebarOpen} />
        </MapaComMarcadores>
      </div>

      {isSidebarOpen && (
        <div style={styles.sidebarColumn}>
          {sensorSelecionado ? (
            <GraficoDecibeis sensor={sensorSelecionado} />
          ) : (
            <div style={styles.placeholder}>
              <h3>Selecione um sensor no mapa para ver os detalhes</h3>
            </div>
          )}
          
          <TabelaReferenciaDecibeis />
        </div>
      )}
    </div>
  );
};

export default Dashboard;