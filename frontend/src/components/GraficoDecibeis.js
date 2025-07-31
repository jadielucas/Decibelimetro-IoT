import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { gerarCorDinamica } from '../utils/colorUtils';

const CustomTooltip = ({ active, payload, label }) => {

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{new Date(label).toLocaleString('pt-BR')}</p>
        <p style={{ margin: '5px 0 0', color: '#3399ff' }}>{`Média: ${data.avg_db.toFixed(2)} dB`}</p>
        <p style={{ margin: '5px 0 0', color: '#00C49F' }}>{`Mínimo: ${data.min_db.toFixed(2)} dB`}</p>
        <p style={{ margin: '5px 0 0', color: '#FF8042' }}>{`Máximo: ${data.max_db.toFixed(2)} dB`}</p>
      </div>
    );
  }
  return null;
};

function GraficoDecibeis({ sensor }) {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dataInicioInput, setDataInicioInput] = useState('');
  const [dataFimInput, setDataFimInput] = useState('');

  const [filtroAtivo, setFiltroAtivo] = useState({ inicio: null, fim: null });

  useEffect(() => {
    if (!sensor?.microcontroller_id) return;

    setLoading(true);

    let url = `http://localhost:8000/api/reports?microcontroller_id=${sensor.microcontroller_id}&limit=1000`;
    if (filtroAtivo.inicio) {
      url += `&start_date=${filtroAtivo.inicio}`;
    }
    if (filtroAtivo.fim) {
      url += `&end_date=${filtroAtivo.fim}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const processedData = data
          .map(item => ({
            ...item,
            timestamp: new Date(item.timestamp).getTime()
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setDados(processedData);
      })
      .catch(err => {
        console.error("Erro na requisição:", err);
        setDados([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sensor, filtroAtivo]);

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

  return (
    <div style={{ height: '100%' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>
        Sensor #{sensor?.microcontroller_id} - Níveis de Decibéis
      </h3>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label>De:</label>
        <input type="date" value={dataInicioInput} onChange={(e) => setDataInicioInput(e.target.value)} />
        <label>Até:</label>
        <input type="date" value={dataFimInput} onChange={(e) => setDataFimInput(e.target.value)} />
        <button onClick={handleFiltrar} style={{ padding: '5px 10px' }}>Filtrar</button>
        <button onClick={handleLimparFiltro} style={{ padding: '5px 10px' }}>Limpar</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Carregando dados...</p>
      ) : dados.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Nenhum dado encontrado para o período selecionado.</p>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart

            data={dados}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleDateString('pt-BR')} padding={{ left: 20, right: 20 }} />
            <YAxis domain={['auto', 'auto']} label={{ value: 'Decibéis (dB)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }} />
            <Legend
              wrapperStyle={{ right: 0, left: 'auto' }}
            />
            <Bar dataKey="avg_db" name="Média (dB)" radius={[4, 4, 0, 0]}>
              {dados.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={gerarCorDinamica(entry.avg_db)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default GraficoDecibeis;