const _ = require('lodash');

function getStatistics(arr) {
    const n = arr.length;

    // Calcular count
    const count = n;

    // Calcular sum
    const sum = _.sum(arr);

    // Calcular mean (average)
    const mean = sum / n;

    // Calcular median
    const sortedArr = [...arr].sort((a, b) => a - b);
    let median;
    if (n % 2 === 0) {
        median = (sortedArr[n / 2 - 1] + sortedArr[n / 2]) * 0.5;
    } else {
        median = sortedArr[Math.floor(n / 2)];
    }

    // Calcular mode
    const frequency = _.countBy(arr);
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = Object.keys(frequency).filter(key => frequency[key] === maxFreq).map(Number);

    // Calcular min
    const min = Math.min(...arr);

    // Calcular max
    const max = Math.max(...arr);

    // Calcular range
    const range = max - min;

    // Calcular variance
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;

    // Calcular std (standard deviation)
    const std = Math.sqrt(variance);

    // Calcular quartiles
    const quartile = (sortedArr, q) => {
        const pos = (sortedArr.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if ((sortedArr[base + 1] !== undefined)) {
            return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
        } else {
            return sortedArr[base];
        }
    };
    const q1 = quartile(sortedArr, 0.25);
    const q2 = median; // Q2 es la mediana
    const q3 = quartile(sortedArr, 0.75);

    // Calcular rango interquartilico (IQR)
    const iqr = q3 - q1;

    return {
        count,
        sum,
        mean,
        median,
        mode,
        min,
        max,
        range,
        std,
        variance,
        quartiles: {
            Q1: q1,
            Q2: q2,
            Q3: q3
        },
        iqr
    };
}

function getStatisticsString(arr, X = 5) {
    // Calcular frecuencia de cada elemento
    const frequency = _.countBy(arr);

    // Convertir frecuencia en un array de [key, count]
    const freqArray = Object.entries(frequency).map(([key, count]) => ({key, count}));

    // Ordenar por frecuencia descendente
    const sortedFreqArray = _.orderBy(freqArray, ['count'], ['desc']);

    // Calcular la moda (elementos con mayor frecuencia)
    const maxFreq = sortedFreqArray[0].count;
    const mode = sortedFreqArray.filter(item => item.count === maxFreq).map(item => item.key);

    // X más repetidos
    const mostFrequent = sortedFreqArray.slice(0, X).map(item => item.key);

    // X menos repetidos (ordenado por frecuencia ascendente)
    const leastFrequent = _.orderBy(freqArray, ['count'], ['asc']).slice(0, X).map(item => item.key);

    // Valores diferentes (que no se repiten)
    const uniqueValues = freqArray.filter(item => item.count === 1).map(item => item.key);

    return {
        mode,
        mostFrequent,
        leastFrequent,
        uniqueValues
    };
}

module.exports = {getStatistics, getStatisticsString}
