import React, { useState } from 'react'
import MapaComMarcadores from './components/MapaComMarcadores'
import GraficoDecibeis from './components/GraficoDecibeis'

function App() {
  const [sensorSelecionado, setSensorSelecionado] = useState(null)

  const handleMarkerClick = (sensor) => {
    setSensorSelecionado(sensor)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Mapa (ocupa toda a tela) */}
      <div style={{ width: '100%', height: '100%' }}>
        <MapaComMarcadores onMarkerClick={handleMarkerClick} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '600px',
          height: '400px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          padding: '20px',
          pointerEvents: 'auto',
          opacity: sensorSelecionado ? 1 : 0,
          transform: sensorSelecionado ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          visibility: sensorSelecionado ? 'visible' : 'hidden'
        }}
      >
        <button 
          onClick={() => setSensorSelecionado(null)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, background 0.2s',
            transform: sensorSelecionado ? 'scale(1)' : 'scale(0)',
            ':hover': {
              background: '#cc0000',
              transform: 'scale(1.1)'
            }
          }}
        >
          ×
        </button>
        {sensorSelecionado && <GraficoDecibeis sensor={sensorSelecionado} />}
      </div>
    </div>
  )
}

export default App