function getImageForWeather(data, i) {
    const img = new Image();
    img.width = 16;
    img.height = 16;
    img.src = "icons/" + data[i].weather + ".png";
    return img;
}

async function clearTemperatures() {
    const container = document.getElementById('temperatures-chart');
    // Remove the previous canvas if it exists
    const oldCanvas = container.querySelector('canvas');
    if (oldCanvas) {
        oldCanvas.remove();
    }
}

async function displayTemperatures(data) {
    const container = document.getElementById('temperatures-chart');
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    // https://stackoverflow.com/a/63913674
    let rollingLabel;
    window.chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.map(({ date }) => formatDate(date, false).textContent),
            datasets: [{
                    label: 'Température',
                    data: data.map(({ temperature }) => temperature),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    pointStyle: data.map((_, i) => getImageForWeather(data, i))
                },
                {
                    label: 'Température maximale',
                    data: data.map(({ max_temperature }) => max_temperature),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Cm de neige',
                    data: data.map(({ snow_cm }) => snow_cm),
                    type: 'bar',
                    yAxisID: 'snow',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.formattedValue + ' °C';
                        }
                    }
                },
            },
            scales: {
                x: {
                    grid: {
                        offset: false,
                    },
                    ticks: {
                        stepSize: 30,
                        autoSkip: false,
                        callback: function(label, index, labels) {
                            let _label = (/^\d+-(\d+)-\d+$/.exec(data[label].date) || [])[1];
                            if (rollingLabel != _label) {
                                rollingLabel = _label;
                                return this.getLabelForValue(label).replace(/^\d+\S* /, "");
                            }
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value, index, ticks) {
                            return Chart.Ticks.formatters.numeric.apply(this, [value, index, ticks]) + ' °C';
                        }
                    }
                },
                snow: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cm de neige'
                    }
                }
            }
        }
    });
}
