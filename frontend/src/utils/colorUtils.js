export const MIN_DB = 40;  // Nível considerado "silencioso" (verde)
export const MAX_DB = 110; // Nível considerado "muito ruidoso" (vermelho)

// Função que gera a cor do verde para o vermelho
export const gerarCorDinamica = (avgDb) => {
  // Garante que o valor de dB esteja dentro dos nossos limites para o cálculo
  const valorNormalizado = Math.max(MIN_DB, Math.min(avgDb ?? MIN_DB, MAX_DB));
  
  const percentual = (valorNormalizado - MIN_DB) / (MAX_DB - MIN_DB);

  // Interpolação de cor: Verde -> Amarelo -> Vermelho
  let r, g;

  if (percentual < 0.5) {
    // Primeira metade: Verde para Amarelo
    r = Math.round(255 * (percentual * 2));
    g = 255;
  } else {
    // Segunda metade: Amarelo para Vermelho
    r = 255;
    g = Math.round(255 * (1 - (percentual - 0.5) * 2));
  }
  const b = 0; // Mantemos o azul zerado

  return `rgb(${r},${g},${b})`;
};