import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

const MapaComMarcadores = ({ onMarkerClick }) => {
  const [relatorios, setRelatorios] = useState([])

  useEffect(() => {
    fetch('http://localhost:8000/api/reports')
      .then(res => res.json())
      .then(data => {
        // Agrupar por microcontroller_id e manter apenas o mais recente
        const vistos = new Set()
        const unicos = []
        for (const r of data) {
          if (!vistos.has(r.microcontroller_id)) {
            vistos.add(r.microcontroller_id)
            unicos.push(r)
          }
        }
        setRelatorios(unicos)
      })
      .catch(err => console.error("Erro ao buscar relatórios:", err))
  }, [])

  return (
    <MapContainer center={[-3.7849, -38.556]} zoom={15} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      
      {relatorios.map((report) => (
        <Marker
          key={report.report_id}
          position={[report.latitude, report.longitude]}
          eventHandlers={{
            click: () => onMarkerClick(report)
          }}
          icon={icon}
        >
          <Popup>
            <b>Sensor #{report.microcontroller_id}</b><br />
            Média: {report.avg_db} dB<br />
            Mínimo: {report.min_db} dB<br />
            Máximo: {report.max_db} dB<br />
            {new Date(report.timestamp).toLocaleString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapaComMarcadores