import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Funções de Geração de CPF REAL (e válido) ---
function gerarDigitoVerificador(cpfParcial: string) {
  let soma = 0;
  let peso = cpfParcial.length + 1;

  for (let i = 0; i < cpfParcial.length; i++) {
    soma += parseInt(cpfParcial.charAt(i)) * peso;
    peso--;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function formatarCPF(cpf: string) {
  // Garante que o CPF tem 11 dígitos antes de formatar
  if (cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function gerarCPFValido(): string {
  let cpfNumeros = '';
  // Gera os primeiros 9 dígitos aleatoriamente
  for (let i = 0; i < 9; i++) {
    cpfNumeros += Math.floor(Math.random() * 10);
  }

  // Calcula o primeiro dígito verificador
  const digito1 = gerarDigitoVerificador(cpfNumeros);
  cpfNumeros += digito1;

  // Calcula o segundo dígito verificador
  const digito2 = gerarDigitoVerificador(cpfNumeros);
  cpfNumeros += digito2;

  return formatarCPF(cpfNumeros);
}

export const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  let formatted = cleaned;
  if (cleaned.length > 0) {
    formatted = `(${cleaned.slice(0, 2)}`;
  }
  if (cleaned.length >= 3) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)}`;
  }
  if (cleaned.length >= 4) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}`;
  }
  if (cleaned.length >= 8) {
    formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }
  return formatted;
};
