// Global variables
let globalData = [];
let filteredData = [];
let charts = {};

// Sample data com datas corretas em 2023 - CAMPO TIO2_EUR CORRIGIDO
const sampleData = [
    {
        Data: "01/01/2023",
        Celulose_EUR: "1.286,35",
        Celulose_USD: "1.379,95",
        TIO2_EUR: "3.400,00",
        Melamina_USD: "1.749,22",
        Ureia_USD: "635,47",
        Metanol_USD: "453,17",
        Resina_UF_BRL: "2.985,00",
        Resina_MF_BRL: "5.713,00",
        USDBRL: "5,07",
        EURBRL: "5,51",
        CNYBRL: "0,75",
        USDBRL_GPC: "5,24",
        CNT_EU_EUR: "729,30",
        CNT_CN_USD: "5.120,83",
        CNT_GQ_USD: "3.323,50",
        CNT_CG_USD: "3.250,00",
        CNT_VC_USD: "4.773,00"
    },
    {
        Data: "08/01/2023",
        Celulose_EUR: "1.295,20",
        Celulose_USD: "1.390,15",
        TIO2_EUR: "3.450,00",
        Melamina_USD: "1.760,30",
        Ureia_USD: "642,15",
        Metanol_USD: "458,90",
        Resina_UF_BRL: "3.012,00",
        Resina_MF_BRL: "5.745,00",
        USDBRL: "5,12",
        EURBRL: "5,56",
        CNYBRL: "0,76",
        USDBRL_GPC: "5,29",
        CNT_EU_EUR: "735,45",
        CNT_CN_USD: "5.145,20",
        CNT_GQ_USD: "3.340,25",
        CNT_CG_USD: "3.265,80",
        CNT_VC_USD: "4.790,50"
    }
];

// NYRIA 2025 colors
const chartColors = {
    terracotta: '#B34A3A',
    terracottaLight: '#CD853F',
    violet: '#4A148C',
    violetMedium: '#7B1FA2',
    brown: '#8B4513',
    olive: '#6B8E23',
    stone: '#708090',
    beige: '#F5F5DC'
};

// Configuração das séries para cada gráfico
const chartSeriesConfig = {
    'celulose': [
        { field: 'Celulose_EUR', label: 'EUR', color: '#B34A3A' },
        { field: 'Celulose_USD', label: 'USD', color: '#CD853F' }
    ],
    'tio2': [
        { field: 'TIO2_EUR', label: 'EUR', color: '#4A148C' }
    ],
    'insumos': [
        { field: 'Melamina_USD', label: 'MEL', color: '#8B4513' },
        { field: 'Ureia_USD', label: 'URE', color: '#6B8E23' },
        { field: 'Metanol_USD', label: 'MET', color: '#708090' }
    ],
    'resinas': [
        { field: 'Resina_UF_BRL', label: 'UF', color: '#B34A3A' },
        { field: 'Resina_MF_BRL', label: 'MF', color: '#8B4513' },
        { field: 'USDBRL_GPC', label: 'GPC', color: '#4A148C' }
    ],
    'moedas': [
        { field: 'USDBRL', label: 'USD', color: '#708090' },
        { field: 'EURBRL', label: 'EUR', color: '#B34A3A' },
        { field: 'CNYBRL', label: 'CNY', color: '#CD853F' }
    ],
    'freteimport': [
        { field: 'CNT_EU_EUR', label: 'Europa', color: '#4A148C' },
        { field: 'CNT_CN_USD', label: 'China', color: '#8B4513' }
    ],
    'freteexport': [
        { field: 'CNT_GQ_USD', label: 'GQ', color: '#6B8E23' },
        { field: 'CNT_CG_USD', label: 'CG', color: '#8B4513' },
        { field: 'CNT_VC_USD', label: 'VC', color: '#B34A3A' }
    ]
};

// --- Funções auxiliares ---
function parseBrazilianNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Remove pontos (milhares) e troca vírgula por ponto decimal
        const clean = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;

    // Tratamento para string formato brasileiro dd/mm/aaaa
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                return new Date(year, month - 1, day);
            }
        }
        return null;
    }

    // Tratamento para número serial Excel
    if (typeof dateStr === 'number') {
        const utc_days = Math.floor(dateStr - 25569);
        const utc_seconds = utc_days * 86400;
        const date = new Date(utc_seconds * 1000);
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }

    // Para strings em outros formatos
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateBR(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDateBR(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleaned = dateStr.trim();
    const pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = cleaned.match(pattern);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;

    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== (month - 1) || date.getFullYear() !== year) return null;

    return date;
}

function validateDateInput(input) {
    const pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    return pattern.test(input.trim());
}

function formatNumber(value) {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatCurrency(value, currency = '') {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return `${currency}${formatNumber(value)}`;
}

function processData(rawData) {
    console.log('Processing data - inicial:', rawData.length, 'registros');

    const processedData = rawData.map((row, index) => {
        const processed = { ...row };
        processed.Data = parseLocalDate(processed.Data);

        Object.keys(processed).forEach(key => {
            if (key !== 'Data') {
                const originalValue = processed[key];
                processed[key] = parseBrazilianNumber(processed[key]);

                if (key === 'TIO2_EUR') {
                    console.log(`Linha ${index}: TIO2_EUR - Original: "${originalValue}" -> Processado: ${processed[key]}`);
                }
            }
        });

        return processed;
    }).filter(row => row.Data && row.Data instanceof Date && !isNaN(row.Data.getTime()));

    processedData.sort((a, b) => a.Data - b.Data);

    console.log('Processing data - final:', processedData.length, 'registros válidos');
    return processedData;
}

function filterDataByDate(data, startDate, endDate) {
    if (!startDate || !endDate) return data;
    return data.filter(row => {
        const date = row.Data;
        return date >= startDate && date <= endDate;
    });
}

// --- Funções de cálculo de métricas ---
function calculatePercentageChange(oldValue, newValue) {
    if (!oldValue || oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

function formatPercentage(value, showSign = true) {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    const formatted = Math.abs(value).toFixed(1) + '%';
    const sign = value > 0 ? '+' : (value < 0 ? '-' : '');
    return showSign ? sign + formatted : formatted;
}

function getMetricClass(value) {
    if (typeof value !== 'number' || isNaN(value)) return 'neutral';
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
}

// FUNÇÃO CORRIGIDA ESPECÍFICAMENTE PARA OS DADOS DE FRETE
function calculatePeriodMetrics(data, field) {
    if (!data || data.length === 0) return { period: null, ytd: null, mom: null };

    console.log(`Calculando métricas para campo: ${field}`);
    console.log(`Total de registros recebidos: ${data.length}`);

    // Filtrar dados válidos (não nulos/undefined/zero) para o campo específico
    const validData = data.filter(row => {
        const value = row[field];
        const isValid = value !== null && value !== undefined && value !== 0 && !isNaN(value) && value !== '';
        if (!isValid && (field.includes('CNT_'))) {
            console.log(`Campo ${field} - Registro inválido em ${formatDateBR(row.Data)}: ${value}`);
        }
        return isValid;
    });

    console.log(`Registros válidos para ${field}: ${validData.length}`);

    if (validData.length === 0) {
        console.log(`Nenhum dado válido encontrado para ${field}`);
        return { period: null, ytd: null, mom: null };
    }

    // Mostrar primeira e última data com dados válidos
    if (field.includes('CNT_')) {
        console.log(`${field} - Primeira data com dados: ${formatDateBR(validData[0].Data)}`);
        console.log(`${field} - Última data com dados: ${formatDateBR(validData[validData.length - 1].Data)}`);
        console.log(`${field} - Primeiro valor: ${validData[0][field]}`);
        console.log(`${field} - Último valor: ${validData[validData.length - 1][field]}`);
    }

    // Período: primeiro vs último do filtro (dados válidos)
    const firstValue = validData[0][field];
    const lastValue = validData[validData.length - 1][field];
    const period = calculatePercentageChange(firstValue, lastValue);

    // YTD: primeiro valor do ano corrente vs último valor (dados válidos)
    const currentYear = new Date().getFullYear();
    const ytdData = validData.filter(d => d.Data.getFullYear() === currentYear);
    let ytd = null;
    if (ytdData.length > 1) {
        const firstYtdValue = ytdData[0][field];
        const lastYtdValue = ytdData[ytdData.length - 1][field];
        ytd = calculatePercentageChange(firstYtdValue, lastYtdValue);
    }

    // MOM: penúltimo vs último valor (dados válidos)
    let mom = null;
    if (validData.length > 1) {
        const secondLastValue = validData[validData.length - 2][field];
        mom = calculatePercentageChange(secondLastValue, lastValue);
    }

    if (field.includes('CNT_')) {
        console.log(`${field} - Métricas calculadas: Period=${period}, YTD=${ytd}, MOM=${mom}`);
    }

    return { period, ytd, mom };
}

// Ordem das métricas CORRIGIDA: MOM, YTD, ALL
const metricsOrder = [
    { key: 'mom', label: 'MOM' },
    { key: 'ytd', label: 'YTD' },
    { key: 'period', label: 'ALL' }
];

function updateChartMetrics(chartType) {
    if (filteredData.length === 0) return;

    const seriesConfig = chartSeriesConfig[chartType];
    if (!seriesConfig) return;

    console.log(`Atualizando métricas para: ${chartType}`);

    // Limpar o container de métricas
    const metricsContainer = document.getElementById(`${chartType}Metrics`);
    if (!metricsContainer) return;

    // Criar HTML para múltiplas séries
    let metricsHTML = '';

    // Header com os nomes das séries
    metricsHTML += '<div class="metrics-header">';
    seriesConfig.forEach(series => {
        metricsHTML += `<div class="series-header">${series.label}</div>`;
    });
    metricsHTML += '</div>';

    // Métricas para cada tipo (MOM, YTD, ALL)
    metricsOrder.forEach(metricType => {
        metricsHTML += '<div class="metric-row">';
        metricsHTML += `<div class="metric-row-label">${metricType.label}</div>`;

        seriesConfig.forEach(series => {
            const metrics = calculatePeriodMetrics(filteredData, series.field);
            const value = metrics[metricType.key];
            const formattedValue = formatPercentage(value);
            const cssClass = getMetricClass(value);

            metricsHTML += `<div class="metric-cell">`;
            metricsHTML += `<span class="metric-value ${cssClass}">${formattedValue}</span>`;
            metricsHTML += '</div>';
        });

        metricsHTML += '</div>';
    });

    metricsContainer.innerHTML = metricsHTML;

    // Definir o atributo data-series para ajustar o layout
    metricsContainer.setAttribute('data-series', seriesConfig.length);
}

// Resto do código continua igual...
// (Funções de criação de gráficos, upload, etc.)

// Código de inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado');

    // Carregar dados de exemplo
    globalData = processData(sampleData);
    filteredData = [...globalData];

    // Criar todos os gráficos
    createAllCharts();

    // Atualizar todas as métricas
    updateAllMetrics();
});

function createAllCharts() {
    // Implementar criação dos gráficos aqui
    console.log('Criando gráficos...');
}

function updateAllMetrics() {
    Object.keys(chartSeriesConfig).forEach(chartType => {
        updateChartMetrics(chartType);
    });
}
