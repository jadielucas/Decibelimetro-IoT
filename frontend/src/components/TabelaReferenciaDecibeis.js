import React from 'react';

const referencias = [
  { db: 130, fonte: 'Show de Rock, avião a jato' },
  { db: 120, fonte: 'Rebitadeira, limiar da dor' },
  { db: 115, fonte: 'Cortador de grama' },
  { db: 100, fonte: 'Metrô, britadeira' },
  { db: 90, fonte: 'Motocicleta, tráfego pesado' },
  { db: 88, fonte: 'Automóvel' },
  { db: 80, fonte: 'Canto alto, despertador' },
  { db: 70, fonte: 'Conversação normal' },
  { db: 60, fonte: 'Rua silenciosa' },
  { db: 50, fonte: 'Casa silenciosa, geladeira' },
  { db: 40, fonte: 'Sussurro, biblioteca' },
  { db: 20, fonte: 'Limiar da audição' },
];


const MIN_DB = 20;
const MAX_DB = 130;

const gerarCorParaDb = (valorDb) => {
  const percentual = (valorDb - MIN_DB) / (MAX_DB - MIN_DB);
  let r, g, b = 0;

  if (percentual < 0.5) {
    r = Math.round(255 * (percentual * 2));
    g = 255;
  } else {
    r = 255;
    g = Math.round(255 * (1 - (percentual - 0.5) * 2));
  }
  return { r, g, b };
};

const getContrastingTextColor = (color) => {
  const luminancia = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
  return luminancia > 0.5 ? '#000000' : '#FFFFFF';
};


const TabelaReferenciaDecibeis = () => {
  const styles = {

    container: { padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', marginTop: '20px' },
    title: { marginBottom: '15px', color: '#333', textAlign: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' },
    source: { color: '#555', textAlign: 'left', flex: 1 },
    
    dbBadgeContainer: {
      minWidth: '100px',
      display: 'flex',
      justifyContent: 'flex-start',
      paddingRight: '15px',
    },
    dbBadge: {
      padding: '4px 12px',
      borderRadius: '12px',
      fontWeight: 'bold',
      fontSize: '0.9em',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Referência de Níveis de Ruído</h4>
      <div>
        {[...referencias].reverse().map((item) => {
          const corObj = gerarCorParaDb(item.db);
          const corFundo = `rgb(${corObj.r}, ${corObj.g}, ${corObj.b})`;
          const corTexto = getContrastingTextColor(corObj);

          return (
            <div key={item.db} style={styles.row}>
              <div style={styles.dbBadgeContainer}>
                <span style={{ 
                  ...styles.dbBadge, 
                  backgroundColor: corFundo, 
                  color: corTexto 
                }}>
                  {item.db} dB
                </span>
              </div>
              <span style={styles.source}>{item.fonte}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TabelaReferenciaDecibeis;