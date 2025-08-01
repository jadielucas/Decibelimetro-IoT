import React from 'react'; // Não precisamos mais de useState e useEffect
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { gerarCorDinamica } from '../utils/colorUtils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        border: '1px solid #ccc', 
        padding: '10px',
        borderRadius: '5px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{new Date(label).toLocaleString('pt-BR')}</p>
        {/* Usamos '?? 0' para garantir que não quebre se o dado for nulo */}
        <p style={{ margin: '5px 0 0', color: '#3399ff' }}>{`Média: ${(data.avg_db ?? 0).toFixed(2)} dB`}</p>
        <p style={{ margin: '5px 0 0', color: '#00C49F' }}>{`Mínimo: ${(data.min_db ?? 0).toFixed(2)} dB`}</p>
        <p style={{ margin: '5px 0 0', color: '#FF8042' }}>{`Máximo: ${(data.max_db ?? 0).toFixed(2)} dB`}</p>
      </div>
    );
  }
  return null;
};

function GraficoDecibeis({ sensor, data }) {

  return (
    <div style={{ height: '100%' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>
        Sensor #{sensor?.microcontroller_id} - Níveis de Decibéis
      </h3>

      {!data || data.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Aguardando dados ou nenhum dado encontrado...</p>
      ) : (
        <ResponsiveContainer width="100%" height="80%">
          <BarChart
            data={data} // Usa a prop 'data'
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
              padding={{ left: 20, right: 20 }} 
            />
            <YAxis domain={['auto', 'auto']} label={{ value: 'Decibéis (dB)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }}/>
            
            <Bar dataKey="avg_db" name="Média (dB)" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => ( // Também usa a prop 'data'
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