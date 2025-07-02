import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Componente para o Tooltip personalizado
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Acessa todos os dados do ponto
    return (
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        border: '1px solid #ccc', 
        padding: '10px',
        borderRadius: '5px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {new Date(label).toLocaleString('pt-BR')}
        </p>
        <p style={{ margin: '5px 0 0', color: '#3399ff' }}>
          {`Média: ${data.avg_db.toFixed(2)} dB`}
        </p>
        <p style={{ margin: '5px 0 0', color: '#00C49F' }}>
          {`Mínimo: ${data.min_db.toFixed(2)} dB`}
        </p>
        <p style={{ margin: '5px 0 0', color: '#FF8042' }}>
          {`Máximo: ${data.max_db.toFixed(2)} dB`}
        </p>
      </div>
    );
  }
  return null;
};

function GraficoDecibeis({ sensor }) {
  const [dados, setDados] = useState([]);
  // ✨ 1. Estados para o filtro de data
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // O useMemo agora filtra com base nas datas selecionadas
  const dadosFiltrados = useMemo(() => {
    if (!dataInicio || !dataFim) {
      return dados; // Se não houver datas, retorna todos os dados carregados
    }
    const inicio = new Date(dataInicio).getTime();
    // Adiciona 1 dia ao fim para incluir o dia inteiro
    const fim = new Date(dataFim).getTime() + (24 * 60 * 60 * 1000 - 1);

    return dados.filter(item => item.timestamp >= inicio && item.timestamp <= fim);
  }, [dados, dataInicio, dataFim]);

  useEffect(() => {
    if (!sensor?.microcontroller_id) return;
    
    // NOTA: Idealmente, o filtro de data seria feito na API. Veja a seção de otimização abaixo.
    fetch(`http://localhost:8000/api/reports?microcontroller_id=${sensor.microcontroller_id}&limit=1000`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
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
          .sort((a, b) => a.timestamp - b.timestamp);
        setDados(processedData);
      })
      .catch(err => console.error("Erro na requisição:", err));
  }, [sensor]);

  return (
    <div style={{ height: '100%' }}>
      <h3 style={{ marginBottom: '9px', color: '#333' }}>
        Sensor #{sensor?.microcontroller_id} - Níveis de Decibéis
      </h3>

      {/* ✨ 2. Novos inputs para o filtro de data */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: '8px' }}>De:</label>
          <input 
            type="date" 
            value={dataInicio} 
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ marginRight: '8px' }}>Até:</label>
          <input 
            type="date" 
            value={dataFim} 
            onChange={(e) => setDataFim(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {dados.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Carregando dados ou nenhum dado encontrado...</p>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart
            data={dadosFiltrados}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => new Date(ts).toLocaleDateString('pt-BR')}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis domain={['auto', 'auto']} label={{ value: 'Decibéis (dB)', angle: -90, position: 'insideLeft' }} />
            
            {/* ✨ 3. Tooltip personalizado e uma única barra */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}/>
            
            <Bar dataKey="avg_db" name="Média (dB)" fill="#3399ff" radius={[4, 4, 0, 0]} />
            
            {/* As barras de mínimo e máximo foram removidas daqui */}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default GraficoDecibeis;