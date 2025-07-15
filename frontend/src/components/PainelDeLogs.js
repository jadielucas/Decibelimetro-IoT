import React, { useState, useEffect } from 'react';

// Função para obter o estilo (ícone e cor) com base no nível do log
const getLogStyle = (level) => {
  switch (level.toUpperCase()) {
    case 'ALERTA':
      return { icon: '⚠️', color: '#ff9800' }; // Laranja para alertas
    case 'INFO':
      return { icon: 'ℹ️', color: '#007bff' }; // Azul para informações
    default:
      return { icon: '🔹', color: '#6c757d' }; // Padrão
  }
};

const PainelDeLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/logs?limit=100')
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar logs');
        return res.json();
      })
      .then(data => {
        setLogs(data);
      })
      .catch(err => {
        console.error("Erro ao buscar logs:", err);
        setLogs([]); // Garante que logs seja um array em caso de erro
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // O array vazio faz com que o fetch ocorra apenas uma vez, quando o componente é montado

  const styles = {
    container: {
      paddingTop: '15px',
    },
    logItem: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '10px 5px',
      borderBottom: '1px solid #e0e0e0',
    },
    icon: {
      fontSize: '1.2em',
      marginRight: '12px',
      marginTop: '2px',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
    },
    message: {
      margin: 0,
      color: '#333',
    },
    timestamp: {
      margin: 0,
      fontSize: '0.8em',
      color: '#888',
      marginTop: '4px',
    },
  };

  if (loading) {
    return <p>Carregando histórico...</p>;
  }

  if (logs.length === 0) {
    return <p>Nenhum evento no histórico.</p>;
  }

  return (
    <div style={styles.container}>
      {logs.map(log => {
        const style = getLogStyle(log.level);
        return (
          <div key={log.id} style={{...styles.logItem, borderLeft: `4px solid ${style.color}`}}>
            <span style={styles.icon}>{style.icon}</span>
            <div style={styles.content}>
              <p style={styles.message}>{log.message}</p>
              <p style={styles.timestamp}>
                {new Date(log.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PainelDeLogs;