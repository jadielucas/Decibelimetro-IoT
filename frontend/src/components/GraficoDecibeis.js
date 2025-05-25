import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

function GraficoDecibeis({ sensor }) {
  const [dados, setDados] = useState([])

  useEffect(() => {
    if (!sensor?.microcontroller_id) return

    fetch(`http://localhost:8000/api/reports?microcontroller_id=${sensor.microcontroller_id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then(data => {
        const processedData = data
          .map(item => ({
            ...item,
            min_db: Number(item.min_db),
            avg_db: Number(item.avg_db),
            max_db: Number(item.max_db),
            timestamp: new Date(item.timestamp).getTime()
          }))
          .sort((a, b) => a.timestamp - b.timestamp)

        setDados(processedData)
      })
      .catch(err => console.error("Erro na requisição:", err))
  }, [sensor])

  return (
    <div style={{ height: '100%' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>
        Microcontrolador #{sensor?.microcontroller_id} - Níveis de Decibéis
      </h3>

      {dados.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Carregando dados...</p>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={dados}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) =>
                new Date(ts).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
              padding={{ left: 20, right: 20 }}
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              labelFormatter={(ts) =>
                new Date(ts).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            />
            <Legend />
            <Bar dataKey="min_db" name="Mínimo (dB)" fill="#00C49F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg_db" name="Média (dB)" fill="#3399ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="max_db" name="Máximo (dB)" fill="#FF8042" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default GraficoDecibeis