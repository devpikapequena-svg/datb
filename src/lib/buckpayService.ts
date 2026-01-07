/**
 * @fileOverview Módulo de serviço para interagir com a API da Buckpay.
 * NO MOMENTO, ESTE ARQUIVO NÃO É UTILIZADO, POIS O WEBHOOK FORNECE TODOS OS DADOS.
 * Mantido para futuras implementações ou consultas diretas se necessário.
 */

const BUCKPAY_API_URL = 'https://api.realtechdev.com.br/v1';

/**
 * Busca os detalhes completos de uma transação pelo seu ID.
 * @param transactionId O ID da transação na Buckpay.
 * @param apiToken O token da API da Buckpay para autenticação.
 * @returns Os dados da transação ou null em caso de erro.
 */
export async function getTransactionById(
  transactionId: string,
  apiToken: string
): Promise<any | null> {
  if (!apiToken) {
    const errorMsg = `[BuckpayService] Token da API (apiToken) não foi fornecido para a transação ${transactionId}.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log(`[BuckpayService] Buscando detalhes da transação ID: ${transactionId}`);
    const response = await fetch(`${BUCKPAY_API_URL}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RecargaJogo/1.0',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[BuckpayService] Erro ao buscar transação ${transactionId}:`, {
        status: response.status,
        data: errorData,
      });
      return null;
    }

    const responseData = await response.json();
    console.log(`[BuckpayService] Detalhes da transação ${transactionId} obtidos com sucesso.`);
    return responseData;
  } catch (error: any) {
    console.error(
      `[BuckpayService] Erro inesperado ao buscar transação ${transactionId}:`,
      error.message
    );
    return null;
  }
}
