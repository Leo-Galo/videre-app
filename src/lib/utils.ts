import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateSafe = (dateString?: string, dateFormat: string = 'dd MMM, yyyy') => {
    if (!dateString) return 'N/A';
    try { return format(parseISO(dateString), dateFormat, { locale: es }); }
    catch { return 'Fecha Inválida'; }
};

export const formatCurrencyCRC = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    // Formato con espacio como separador de miles y coma para decimales
    const formattedAmount = new Intl.NumberFormat('es-CR', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    return `¢${formattedAmount.replace(/,/g, ' ')}`;
};

export const getAge = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return new Date().getFullYear() - parseISO(dateString).getFullYear(); }
    catch { return 'N/A'; }
};

export const calculateMargin = (cost?: number, price?: number) => {
    if (cost === undefined || price === undefined || price === 0) return 'N/A';
    const margin = ((price - cost) / price) * 100;
    return `${margin.toFixed(1)}%`;
};
