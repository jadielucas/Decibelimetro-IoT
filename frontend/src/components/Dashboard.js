import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import MapaComMarcadores from './MapaComMarcadores';
import GraficoDecibeis from './GraficoDecibeis';
import TabelaReferenciaDecibeis from './TabelaReferenciaDecibeis';

// --- Constantes e Componentes Auxiliares ---

// Defina a largura desejada para o painel aqui, em um só lugar.
const LARGURA_PAINEL = '550px';

// Componente ajudante que corrige o redimensionamento do mapa
function MapResizer({ isSidebarOpen }) {
  const map = useMap();
  useEffect(() => {
    // Atraso para garantir que a animação de CSS termine antes de redimensionar o mapa
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [isSidebarOpen, map]);

  return null; // Não renderiza nada visível
}


// --- Componente Principal do Dashboard ---

const Dashboard = () => {
  // --- Estados do Componente ---
  const [sensorSelecionado, setSensorSelecionado] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('grafico');
  
  // Estados de dados
  const [reportsMapa, setReportsMapa] = useState([]);
  const [reportsGrafico, setReportsGrafico] = useState([]);
  
  // Estados para os filtros de data do gráfico
  const [dataInicioInput, setDataInicioInput] = useState('');
  const [dataFimInput, setDataFimInput] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState({ inicio: null, fim: null });

  // --- Efeitos (Lifecycle Hooks) ---

  // Efeito para buscar os dados iniciais do mapa (HTTP)
  useEffect(() => {
    fetch('http://localhost:8000/api/reports?latest_positions=true')
      .then(res => res.json())
      .then(data => setReportsMapa(data.sort((a, b) => a.microcontroller_id - b.microcontroller_id)))
      .catch(err => console.error("Erro ao buscar dados do mapa:", err));
  }, []);

  // Efeito para buscar os dados históricos do gráfico quando um sensor ou filtro muda (HTTP)
  useEffect(() => {
    if (sensorSelecionado) {
      let url = `http://localhost:8000/api/reports?microcontroller_id=${sensorSelecionado.microcontroller_id}`;
      if (filtroAtivo.inicio) url += `&start_date=${filtroAtivo.inicio}`;
      if (filtroAtivo.fim) url += `&end_date=${filtroAtivo.fim}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
            const processedData = data.map(item => ({
                ...item,
                timestamp: new Date(item.timestamp).getTime()
            })).sort((a, b) => a.timestamp - b.timestamp);
            setReportsGrafico(processedData);
        })
        .catch(err => console.error("Erro ao buscar dados do gráfico:", err));
    } else {
        setReportsGrafico([]);
    }
  }, [sensorSelecionado, filtroAtivo]);

  // Efeito para gerenciar a conexão WebSocket e atualizações em tempo real
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => console.log('✅ Conectado ao WebSocket');
    ws.onclose = () => console.log('🔌 Desconectado do WebSocket');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'new_report') {
        // Atualiza o estado do MAPA
        setReportsMapa(prevReports => {
          const outrosReports = prevReports.filter(r => r.microcontroller_id !== data.payload.microcontroller_id);
          return [...outrosReports, data.payload].sort((a, b) => a.microcontroller_id - b.microcontroller_id);
        });

        // Atualiza o estado do GRÁFICO, se o novo dado for do sensor selecionado
        if (sensorSelecionado && data.payload.microcontroller_id === sensorSelecionado.microcontroller_id) {
          const newReport = { ...data.payload, timestamp: new Date(data.payload.timestamp).getTime() };
          setReportsGrafico(prevData => [...prevData, newReport]);
        }
      }
    };

    // Limpeza: fecha a conexão quando o componente for desmontado
    return () => ws.close();
  }, [sensorSelecionado]); // Depende do sensor para saber qual gráfico atualizar


  // --- Funções de Manipulação (Handlers) ---

  const handleMarkerClick = (sensor) => {
    if (sensorSelecionado?.microcontroller_id !== sensor.microcontroller_id) {
        setSensorSelecionado(sensor);
    }
    setAbaAtiva('grafico');
    setIsSidebarOpen(true); 
  };
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleFiltrar = () => {
    if (dataInicioInput && dataFimInput) {
      setFiltroAtivo({ inicio: dataInicioInput, fim: dataFimInput });
    }
  };

  const handleLimparFiltro = () => {
    setDataInicioInput('');
    setDataFimInput('');
    setFiltroAtivo({ inicio: null, fim: null });
  };
  
  // --- Objeto de Estilos ---
  const styles = {
    dashboardContainer: { position: 'relative', display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', fontFamily: 'sans-serif' },
    mapColumn: { height: '100%', width: isSidebarOpen ? `calc(100% - ${LARGURA_PAINEL})` : '100%', transition: 'width 0.3s ease-in-out' },
    sidebarColumn: { width: LARGURA_PAINEL, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: '#f0f2f5', transition: 'width 0.3s ease-in-out', flexShrink: 0 },
    toggleButton: { position: 'absolute', top: '15px', right: isSidebarOpen ? `calc(${LARGURA_PAINEL} + 15px)` : '15px', zIndex: 1000, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'right 0.3s ease-in-out', fontSize: '1.5em' },
    placeholder: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', backgroundColor: '#fff', borderRadius: '8px', color: '#888', textAlign: 'center', border: '2px dashed #ddd' },
    tabsContainer: { display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '10px' },
    tabButton: { padding: '10px 20px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', fontSize: '1em', color: '#555' },
    activeTab: { borderBottom: '3px solid #007bff', fontWeight: 'bold', color: '#007bff' }
  };

  // --- Renderização do Componente ---
  return (
    <div style={styles.dashboardContainer}>
      <button onClick={toggleSidebar} style={styles.toggleButton} title={isSidebarOpen ? "Fechar Painel" : "Abrir Painel"}>
        {isSidebarOpen ? '»' : '«'}
      </button>

      <div style={styles.mapColumn}>
        <MapaComMarcadores reports={reportsMapa} onMarkerClick={handleMarkerClick}>
          <MapResizer isSidebarOpen={isSidebarOpen} />
        </MapaComMarcadores>
      </div>

      {isSidebarOpen && (
        <div style={styles.sidebarColumn}>
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

          {abaAtiva === 'grafico' && (
            <>
              {sensorSelecionado ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.9em' }}>
                    <label>De:</label>
                    <input type="date" value={dataInicioInput} onChange={(e) => setDataInicioInput(e.target.value)} />
                    <label>Até:</label>
                    <input type="date" value={dataFimInput} onChange={(e) => setDataFimInput(e.target.value)} />
                    <button onClick={handleFiltrar} style={{ padding: '4px 8px' }}>Filtrar</button>
                    <button onClick={handleLimparFiltro} style={{ padding: '4px 8px' }}>Limpar</button>
                  </div>
                  
                  <GraficoDecibeis 
                    key={sensorSelecionado.microcontroller_id}
                    sensor={sensorSelecionado} 
                    data={reportsGrafico}
                  />
                </>
              ) : (
                <div style={styles.placeholder}>
                  <h3>Selecione um sensor no mapa para ver os detalhes</h3>
                </div>
              )}
              <TabelaReferenciaDecibeis />
            </>
          )}

          {abaAtiva === 'logs' && (
             <p style={{textAlign: 'center'}}>O painel de logs está desativado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;