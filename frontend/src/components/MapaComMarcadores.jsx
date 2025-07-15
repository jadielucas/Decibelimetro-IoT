import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MIN_DB = 40;
const MAX_DB = 110;

const gerarCorParaMarcador = (avgDb) => {

  const valorNormalizado = Math.max(MIN_DB, Math.min(avgDb, MAX_DB));
  
  const percentual = (valorNormalizado - MIN_DB) / (MAX_DB - MIN_DB);

  let r, g;

  if (percentual < 0.5) {

    r = Math.round(255 * (percentual * 2));
    g = 255;
  } else {

    r = 255;
    g = Math.round(255 * (1 - (percentual - 0.5) * 2));
  }
  const b = 0;

  return `rgb(${r},${g},${b})`;
};

const criarIconeDeMarcador = (cor) => {

  const marcadorSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker">
      <path fill-opacity="0.9" stroke="#000" stroke-width="1" stroke-opacity="0.5" fill="${cor}" d="M16 0 C10.48 0 6 4.48 6 10 C6 16.5 16 32 16 32 S26 16.5 26 10 C26 4.48 21.52 0 16 0 Z M16 14 A4 4 0 0 1 12 10 A4 4 0 0 1 16 6 A4 4 0 0 1 20 10 A4 4 0 0 1 16 14 Z"/>
    </svg>`;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(marcadorSvg)}`,
    iconSize: [34, 34],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const MapaComMarcadores = ({ onMarkerClick, children }) => {
  const [relatorios, setRelatorios] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/reports')
      .then(res => res.json())
      .then(data => {
        const vistos = new Set();
        const unicos = [];
        for (const r of data) {
          if (!vistos.has(r.microcontroller_id)) {
            vistos.add(r.microcontroller_id);
            unicos.push(r);
          }
        }
        setRelatorios(unicos);
      })
      .catch(err => console.error("Erro ao buscar relatórios:", err));
  }, []);

  return (
    <MapContainer center={[-3.7849, -38.556]} zoom={15} style={{ height: '100vh', width: '100%' }}>
      {/* ✨ 2. Renderize os 'children' aqui dentro */}
      {children}
      
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      
      {relatorios.map((report) => {
        const corDoMarcador = gerarCorParaMarcador(report.avg_db);
        const iconeDinamico = criarIconeDeMarcador(corDoMarcador);

        return (
          <Marker
            key={report.report_id}
            position={[report.latitude, report.longitude]}
            eventHandlers={{
              click: () => onMarkerClick(report)
            }}
            icon={iconeDinamico}
          >
            <Popup>
              <b>Sensor #{report.microcontroller_id}</b><br />
              <b>Média: {report.avg_db.toFixed(2)} dB</b><br />
              Mínimo: {report.min_db.toFixed(2)} dB<br />
              Máximo: {report.max_db.toFixed(2)} dB<br />
              {new Date(report.timestamp).toLocaleString('pt-BR')}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapaComMarcadores;