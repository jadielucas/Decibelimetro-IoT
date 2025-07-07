import React, { useState } from 'react';
import MapaComMarcadores from './MapaComMarcadores';
import GraficoDecibeis from './GraficoDecibeis';
import TabelaReferenciaDecibeis from './TabelaReferenciaDecibeis';

const Dashboard = () => {
  // Estado para guardar o sensor que foi clicado no mapa
  const [sensorSelecionado, setSensorSelecionado] = useState(null);

  // Função que será chamada quando um marcador for clicado no mapa
  const handleMarkerClick = (sensor) => {
    setSensorSelecionado(sensor);
  };

  const styles = {
    dashboardContainer: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      fontFamily: 'sans-serif'
    },
    mapColumn: {
      flex: 2, // Ocupa 2/3 da tela
      height: '100%'
    },
    sidebarColumn: {
      flex: 1, // Ocupa 1/3 da tela
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto', // Adiciona scroll se o conteúdo for grande
      backgroundColor: '#f0f2f5'
    },
    placeholder: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      color: '#888',
      textAlign: 'center',
      border: '2px dashed #ddd'
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.mapColumn}>
        <MapaComMarcadores onMarkerClick={handleMarkerClick} />
      </div>

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
    </div>
  );
};

export default Dashboard;