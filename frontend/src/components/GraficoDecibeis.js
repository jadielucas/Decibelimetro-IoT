import React, { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

function GraficoDecibeis({ sensor }) {

  const [dados, setDados] = useState([])
  const [periodo, setPeriodo] = useState('1h') // valores possíveis: '1h', '24h', '7d'
  const filtrarPorPeriodo = (dados, periodo) => {
  const agora = Date.now()

    let limiteTempo
    switch (periodo) {

      case '1h':
        limiteTempo = agora - 60 * 60 * 1000 // 1 hora
        break
      case '24h':
        limiteTempo = agora - 24 * 60 * 60 * 1000 // 24 horas
        break
      case '7d':
        limiteTempo = agora - 7 * 24 * 60 * 60 * 1000 // 7 dias
        break
      default:
        return dados
    }

    return dados.filter(item => item.timestamp >= limiteTempo)

  }

  const dadosFiltrados = useMemo(() => {

    return filtrarPorPeriodo(dados, periodo)

  }, [dados, periodo])

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

        Sensor #{sensor?.microcontroller_id} - Níveis de Decibéis

      </h3>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>

        <label style={{ marginRight: '8px' }}>Período:</label>

        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>

          <option value="1h">Última hora</option>

          <option value="24h">Últimas 24h</option>

          <option value="7d">Últimos 7 dias</option>

        </select>

      </div>

      {dados.length === 0 ? (

        <p style={{ textAlign: 'center' }}>Carregando dados...</p>

      ) : (

        <ResponsiveContainer width="100%" height="80%">

          <BarChart

            data={dadosFiltrados}

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