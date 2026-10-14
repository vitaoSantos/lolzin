// Cache em memória com validade. Vive só enquanto a instância da função estiver de pé:
// não é banco de dados, só evita repetir chamadas à Riot em visitas próximas.

export function criarCacheMemoria({ maximo = 500 } = {}) {
  const itens = new Map();

  return {
    async obter(chave, segundos, gerar) {
      const agora = Date.now();
      const item = itens.get(chave);
      if (item && item.expira > agora) {
        // Reinsere para manter a ordem de "uso mais recente".
        itens.delete(chave);
        itens.set(chave, item);
        return item.valor;
      }
      const valor = await gerar();
      itens.set(chave, { valor, expira: agora + segundos * 1000 });
      if (itens.size > maximo) itens.delete(itens.keys().next().value);
      return valor;
    },
  };
}
