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

// Configuração das séries para cada gráfico - COM LABELS CORRIGIDOS E EIXOS DEFINIDOS
const chartSeriesConfig = {
    'celulose': [
        { field: 'Celulose_USD', label: 'USD', color: '#CD853F', yAxisID: 'y' },  // Eixo primário
        { field: 'Celulose_EUR', label: 'EUR', color: '#B34A3A', yAxisID: 'y1' }  // Eixo secundário
    ],
    'tio2': [
        { field: 'TIO2_EUR', label: 'TIO2', color: '#4A148C', yAxisID: 'y' }
    ],
    'insumos': [
        { field: 'Ureia_USD', label: 'URE', color: '#6B8E23', yAxisID: 'y' },      // Eixo primário
        { field: 'Metanol_USD', label: 'MET', color: '#708090', yAxisID: 'y' },    // Eixo primário
        { field: 'Melamina_USD', label: 'MEL', color: '#8B4513', yAxisID: 'y1' }   // Eixo secundário
    ],
    'resinas': [
        { field: 'Resina_UF_BRL', label: 'UF', color: '#B34A3A', yAxisID: 'y' },   // Eixo primário
        { field: 'Resina_MF_BRL', label: 'MF', color: '#8B4513', yAxisID: 'y' },   // Eixo primário
        { field: 'USDBRL_GPC', label: 'USD', color: '#4A148C', yAxisID: 'y1' }     // Eixo secundário
    ],
    'moedas': [
        { field: 'USDBRL', label: 'USD', color: '#708090', yAxisID: 'y' },         // Eixo primário
        { field: 'EURBRL', label: 'EUR', color: '#B34A3A', yAxisID: 'y' },         // Eixo primário
        { field: 'CNYBRL', label: 'CNY', color: '#CD853F', yAxisID: 'y1' }         // Eixo secundário
    ],
    'freteimport': [
        { field: 'CNT_EU_EUR', label: 'EU', color: '#4A148C', yAxisID: 'y' },   // Eixo primário
        { field: 'CNT_CN_USD', label: 'CN', color: '#8B4513', yAxisID: 'y1' }    // Eixo secundário
    ],
    'freteexport': [
        { field: 'CNT_GQ_USD', label: 'GQ', color: '#6B8E23', yAxisID: 'y' },
        { field: 'CNT_CG_USD', label: 'CG', color: '#8B4513', yAxisID: 'y' },
        { field: 'CNT_VC_USD', label: 'VC', color: '#B34A3A', yAxisID: 'y' }
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

// FUNÇÃO CORRIGIDA PARA TODOS OS DADOS (ESPECIALMENTE FRETE)
function calculatePeriodMetrics(data, field) {
    if (!data || data.length === 0) return { period: null, ytd: null, mom: null };

    // Filtrar dados válidos (não nulos/undefined/zero/string vazia) para o campo específico
    const validData = data.filter(row => {
        const value = row[field];
        return value !== null && value !== undefined && value !== 0 && !isNaN(value) && value !== '';
    });

    if (validData.length === 0) return { period: null, ytd: null, mom: null };

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

    return { period, ytd, mom };
}

// ORDEM DAS MÉTRICAS CORRIGIDA: MOM, YTD, ALL
const metricsOrder = [
    { key: 'mom', label: 'MOM' },
    { key: 'ytd', label: 'YTD' },
    { key: 'period', label: 'ALL' }
];

function updateChartMetrics(chartType) {
    if (filteredData.length === 0) return;

    const seriesConfig = chartSeriesConfig[chartType];
    if (!seriesConfig) return;

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

// --- Funções de Upload e Manipulação de Arquivos ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function dropHandler(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
    event.target.classList.remove('dragover');
}

function dragOverHandler(event) {
    event.preventDefault();
}

function dragEnterHandler(event) {
    event.preventDefault();
    event.target.classList.add('dragover');
}

function dragLeaveHandler(event) {
    event.target.classList.remove('dragover');
}

function processFile(file) {
    if (!file) return;

    const statusElement = document.getElementById('uploadStatus');
    statusElement.className = 'upload-status processing';
    statusElement.textContent = 'Processando arquivo...';
    statusElement.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Procurar pela planilha "Final" ou usar a primeira
            let worksheet;
            if (workbook.SheetNames.includes('Final')) {
                worksheet = workbook.Sheets['Final'];
            } else {
                const firstSheetName = workbook.SheetNames[0];
                worksheet = workbook.Sheets[firstSheetName];
            }

            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                throw new Error('Arquivo vazio ou formato inválido');
            }

            // Processar os dados
            globalData = processData(jsonData);
            filteredData = [...globalData];

            // Atualizar campos de data com o período dos dados
            updateDateFilterPlaceholders();

            // Atualizar a interface
            updateAllCharts();
            updateAllMetrics();
            updateKPIs();

            statusElement.className = 'upload-status success';
            statusElement.textContent = `Arquivo carregado com sucesso! ${globalData.length} registros processados.`;

            console.log('Dados carregados:', globalData.length, 'registros');

        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            statusElement.className = 'upload-status error';
            statusElement.textContent = `Erro ao processar arquivo: ${error.message}`;
        }
    };

    reader.onerror = function() {
        statusElement.className = 'upload-status error';
        statusElement.textContent = 'Erro ao ler o arquivo';
    };

    reader.readAsArrayBuffer(file);
}

// FUNÇÃO PARA CARREGAR database.xlsx AUTOMATICAMENTE
function loadDatabaseFile() {
    fetch('./database.xlsx')
        .then(response => {
            if (!response.ok) {
                throw new Error('database.xlsx não encontrado');
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });

            // Procurar pela planilha "Final" ou usar a primeira
            let worksheet;
            if (workbook.SheetNames.includes('Final')) {
                worksheet = workbook.Sheets['Final'];
            } else {
                const firstSheetName = workbook.SheetNames[0];
                worksheet = workbook.Sheets[firstSheetName];
            }

            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length > 0) {
                // Processar os dados
                globalData = processData(jsonData);
                filteredData = [...globalData];

                // Atualizar campos de data com o período dos dados
                updateDateFilterPlaceholders();

                // Atualizar a interface
                updateAllCharts();
                updateAllMetrics();
                updateKPIs();

                console.log('database.xlsx carregado automaticamente:', globalData.length, 'registros');
            } else {
                throw new Error('database.xlsx está vazio');
            }
        })
        .catch(error => {
            console.log('database.xlsx não encontrado, usando dados de exemplo:', error.message);
            // Usar dados de exemplo se o arquivo não for encontrado
            globalData = processData(sampleData);
            filteredData = [...globalData];

            // Atualizar campos de data com o período dos dados de exemplo
            updateDateFilterPlaceholders();

            updateAllCharts();
            updateAllMetrics();
            updateKPIs();
        });
}

// FUNÇÃO PARA ATUALIZAR OS PLACEHOLDERS DOS FILTROS DE DATA
function updateDateFilterPlaceholders() {
    if (globalData.length === 0) return;

    const startDate = globalData[0].Data;
    const endDate = globalData[globalData.length - 1].Data;

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) {
        startDateInput.placeholder = formatDateBR(startDate);
        startDateInput.title = `Dados disponíveis a partir de ${formatDateBR(startDate)}`;
    }

    if (endDateInput) {
        endDateInput.placeholder = formatDateBR(endDate);
        endDateInput.title = `Dados disponíveis até ${formatDateBR(endDate)}`;
    }
}

// --- Funções de Criação de Gráficos COM DOIS EIXOS ---
function createLineChart(chartId, seriesData) {
    const ctx = document.getElementById(chartId);
    if (!ctx) return;

    // Destruir gráfico existente se houver
    if (charts[chartId]) {
        charts[chartId].destroy();
    }

    // Verificar se há séries com eixo secundário
    const hasSecondaryAxis = seriesData.some(series => series.yAxisID === 'y1');

    // Preparar datasets
    const datasets = seriesData.map(series => ({
        label: series.label,
        data: filteredData.map(row => ({
            x: formatDateBR(row.Data),
            y: row[series.field]
        })),
        borderColor: series.color,
        backgroundColor: series.color + '20',
        tension: 0.4,
        fill: false,
        yAxisID: series.yAxisID || 'y'
    }));

    // Configuração das escalas
    const scales = {
        x: {
            type: 'category',
            title: {
                display: true,
                text: 'Data'
            }
        },
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Valor'
            }
        }
    };

    // Adicionar eixo secundário se necessário
    if (hasSecondaryAxis) {
        scales.y1 = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Valor (Eixo 2)'
            },
            grid: {
                drawOnChartArea: false,
            },
        };
    }

    // Criar novo gráfico
    charts[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,  // LEGENDA HABILITADA
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: scales
        }
    });
}

function updateAllCharts() {
    if (filteredData.length === 0) return;

    Object.keys(chartSeriesConfig).forEach(chartType => {
        const chartId = getChartId(chartType);
        const seriesConfig = chartSeriesConfig[chartType];
        createLineChart(chartId, seriesConfig);
    });
}

function getChartId(chartType) {
    const chartIdMap = {
        'celulose': 'celuloseChart',
        'tio2': 'tio2Chart',
        'insumos': 'insumosChart',
        'resinas': 'resinasChart',
        'moedas': 'moedasChart',
        'freteimport': 'freteImportChart',
        'freteexport': 'freteExportChart'
    };
    return chartIdMap[chartType] || chartType + 'Chart';
}

function updateAllMetrics() {
    Object.keys(chartSeriesConfig).forEach(chartType => {
        updateChartMetrics(chartType);
    });
}

// --- Funções de KPI CORRIGIDAS ---
function updateKPIs() {
    if (filteredData.length === 0) return;

    const lastRow = filteredData[filteredData.length - 1];

    // Celulose KPI
    updateKPIBox('celuloseKPI', [
        { label: 'EUR', value: lastRow.Celulose_EUR },
        { label: 'USD', value: lastRow.Celulose_USD }
    ]);

    // TiO2 KPI
    updateKPIBox('tio2KPI', [
        { label: 'TIO2', value: lastRow.TIO2_EUR }
    ]);

    // Resinas KPI
    updateKPIBox('resinasKPI', [
        { label: 'UF', value: lastRow.Resina_UF_BRL },
        { label: 'MF', value: lastRow.Resina_MF_BRL }
    ]);

    // Frete Importação KPI (CORRIGIDO)
    updateKPIBox('freteImportKPI', [
        { label: 'EU', value: lastRow.CNT_EU_EUR || 0 },
        { label: 'CN', value: lastRow.CNT_CN_USD || 0 }
    ]);

    // Frete Exportação KPI (CORRIGIDO)
    const freteExportValue = ((lastRow.CNT_GQ_USD || 0) + (lastRow.CNT_CG_USD || 0) + (lastRow.CNT_VC_USD || 0)) / 3;
    updateKPIBox('freteExportKPI', [
        { label: 'CG', value: lastRow.CNT_CG_USD },
        { label: 'GQ', value: lastRow.CNT_GQ_USD || 0 }
    ]);
}

function updateKPIBox(kpiId, values) {
    const kpiElement = document.getElementById(kpiId);
    if (!kpiElement) return;

    let html = '';
    values.forEach(item => {
        html += `
            <div class="kpi-item">
                <span class="currency">${item.label}</span>
                <span class="value">${formatNumber(item.value)}</span>
            </div>
        `;
    });

    kpiElement.innerHTML = html;
}

// --- Funções de Filtro por Data ---
function setupDateFilters() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', applyDateFilters);
        endDateInput.addEventListener('change', applyDateFilters);
    }
}

function applyDateFilters() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (!startDateInput || !endDateInput) return;

    const startDateStr = startDateInput.value.trim();
    const endDateStr = endDateInput.value.trim();

    let startDate = null;
    let endDate = null;

    if (startDateStr && validateDateInput(startDateStr)) {
        startDate = parseDateBR(startDateStr);
    }

    if (endDateStr && validateDateInput(endDateStr)) {
        endDate = parseDateBR(endDateStr);
    }

    // Aplicar filtro
    if (startDate || endDate) {
        filteredData = filterDataByDate(globalData, startDate, endDate);
    } else {
        filteredData = [...globalData];
    }

    // Atualizar interface
    updateAllCharts();
    updateAllMetrics();
    updateKPIs();

    console.log('Filtro aplicado:', filteredData.length, 'registros');
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado');

    // Configurar filtros de data
    setupDateFilters();

    // Tentar carregar database.xlsx primeiro, depois dados de exemplo
    loadDatabaseFile();

    console.log('Dashboard pronto');
});

// --- Exposição de funções globais para o HTML ---
window.handleFileSelect = handleFileSelect;
window.dropHandler = dropHandler;
window.dragOverHandler = dragOverHandler;
window.dragEnterHandler = dragEnterHandler;
window.dragLeaveHandler = dragLeaveHandler;
