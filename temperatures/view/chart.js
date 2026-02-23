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
                    unitSuffix: "°C",
                    pointStyle: data.map((_, i) => getImageForWeather(data, i))
                },
                {
                    label: 'Température maximale',
                    data: data.map(({ max_temperature }) => max_temperature),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    unitSuffix: "°C"
                },
                {
                    label: 'Pluie',
                    data: data.map(({ rain_mm }) => rain_mm),
                    type: 'bar',
                    yAxisID: 'snow',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    unitSuffix: " mm"
                },
                {
                    label: 'Neige',
                    data: data.map(({ snow_cm }) => snow_cm),
                    type: 'bar',
                    yAxisID: 'snow',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    unitSuffix: " cm"
                }
            ]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let dataset = context.dataset;
                            let ret = "";
                            if (dataset.label)
                                ret += dataset.label + ': ';
                            if (dataset.unitPrefix)
                                ret += dataset.unitPrefix;
                            ret += context.formattedValue;
                            if (dataset.unitSuffix)
                                ret += dataset.unitSuffix;
                            return ret;
                        }
                    }
                }
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
async function displayMonthlyTemperatures(data) {
    const container = document.getElementById('monthly-temperatures-chart');
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    let newData = [];
    let currentMonth;
    let currentItem;
    let itemsNumber = 0;
    for (let item of data) {
        if (currentMonth == null || currentMonth != new Date(item.date).getMonth()) {
            if (currentItem) {
                currentItem.temperature /= itemsNumber;
            }
            currentMonth = new Date(item.date).getMonth();
            currentItem = {date: item.date, temperature: 0, rain_mm: 0, snow_cm: 0};
            newData.push(currentItem);
            itemsNumber = 0;
        }
        currentItem.temperature += item.temperature || 0;
        currentItem.rain_mm += item.rain_mm || 0;
        currentItem.snow_cm += item.snow_cm || 0;
        itemsNumber++;
    }
    currentItem.temperature /= itemsNumber;
    window.chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: newData.map(({ date }) => date.toLocaleString('default', { month: 'long' })),
            datasets: [{
                    label: 'Température moyenne',
                    data: newData.map(({ temperature }) => temperature),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    unitSuffix: "°C"
                },
                {
                    label: 'Pluie cumulée',
                    data: newData.map(({ rain_mm }) => rain_mm),
                    type: 'bar',
                    yAxisID: 'snow',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    unitSuffix: " mm"
                },
                {
                    label: 'Neige cumulée',
                    data: newData.map(({ snow_cm }) => snow_cm),
                    type: 'bar',
                    yAxisID: 'snow',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    unitSuffix: " cm"
                }
            ]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let dataset = context.dataset;
                            let ret = "";
                            if (dataset.label)
                                ret += dataset.label + ': ';
                            if (dataset.unitPrefix)
                                ret += dataset.unitPrefix;
                            ret += context.formattedValue;
                            if (dataset.unitSuffix)
                                ret += dataset.unitSuffix;
                            return ret;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        offset: false,
                    },
                    ticks: {
                        stepSize: 30,
                        autoSkip: false
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
async function displayWeathers(data) {
    let frenchNames = {
        sunny: "Beau temps",
        few_clouds: "Ciel voilé",
        cloudy: "Nuageux",
        rain: "Pluie",
        snow: "Neige"
    };
    const container = document.getElementById('weathers-chart');
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    window.weathersChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: Object.values(frenchNames),
            datasets: [{
                label: 'Nombre de jours',
                data: Object.keys(frenchNames).map(w => data.filter(e => e.weather == w).length),
                backgroundColor: ["#f44336", "#9c27b0", "#1565c0", "#00bcd4", "#4caf50"],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + " : " + context.formattedValue + " jour" + (context.formattedValue >= 2 ? 's' : '') + " (" + (Math.round(context.formattedValue / data.length * 100 * 10) / 10).toLocaleString() + "%)";
                        }
                    }
                }
            }
        }
    });
}
function getStreaks(
    data,
    {
        getId = e => e,
        getValue = e => e,
        isNull = e => !e,
        maxForgiving = 0,
    } = {},
) {
    let currentStreak = null;
    let forgiving = 0;
    let ret = [];
    for (item of data) {
        if (
           !currentStreak ||
           getValue(item) != currentStreak.status && (!isNull(getValue(item)) || ++forgiving > maxForgiving)
        ) {
            forgiving = 0;
            currentStreak = {status: getValue(item), start: getId(item), end: getId(item), length: 1};
            ret.push(currentStreak);
        } else {
            currentStreak.end = getId(item);
            currentStreak.length++;
        }
    }
    return ret;
}
async function displayCat(data, maxForgiving) {
    let streaks = getStreaks(data, {
        getId: e => e.date,
        getValue: e => e.cat,
        maxForgiving,
    }).filter(e => e.length > 1);
    let validStreaks = streaks.filter(e => e.status).sort((a, b) => b.length - a.length);
    let formatter = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    let formatDate = date => formatter.format(new Date(date));
    let maxStreak = validStreaks[0];
    let formatStreak = streak => (
        streak.length + " jour" + (streak.length >= 2 ? "s" : "")
        + " (du " + formatDate(streak.start) + " au " + formatDate(streak.end) + ")"
    );
    document.getElementById("cat-streak").textContent = formatStreak(maxStreak);
    document.getElementById("cat-streaks").textContent = validStreaks.map(formatStreak).join("\n");

    let catChart = document.getElementById("cat-chart");
    catChart.textContent = "";
    let getCell = (style = "", tooltip = "", text = "") => {
        let ret = document.createElement("div");
        ret.className = "cell " + style;
        ret.title = tooltip;
        ret.textContent = text;
        return ret;
    };
    let day = new Date(data[0].date);
    while (day.getDay() != 1)
        day.setDate(day.getDate() - 1);
    while (day.getDate() != 1) {
        catChart.appendChild(getCell());
        day.setDate(day.getDate() + 1);
    }
    let year = day.getFullYear();
    while (day.getFullYear() == year) {
        let iso = day.toISOString().slice(0, 10);
        let item = data.find(e => e.date == iso);
        catChart.appendChild(
            getCell(
                item.cat ? "there" : item.cat == false ? "not-there" : "unknown",
                formatDate(day) + " : " + (item.cat == null ? "on ne sait pas si le chat était là" : "le chat " + (item.cat ? "était" : "n'était pas") + " là"),
                day.getDate() == 1 ? "JFMAMJJASOND"[day.getMonth()] : "",
            )
        );
        day.setDate(day.getDate() + 1);
    }
}
async function displayGlobalData(data) {
    let averageTemperature = data.map(e => e.temperature).reduce((a, b) => a + b) / data.length;
    let rainDays = data.filter(e => e.rain_mm).length;
    let rainTotal = data.map(e => e.rain_mm || 0).reduce((a, b) => a + b);
    let snowDays = data.filter(e => e.snow_cm).length;
    let snowTotal = data.map(e => e.snow_cm || 0).reduce((a, b) => a + b);
    let catDays = data.filter(e => e.cat).length;
    document.getElementById("global-data").textContent = [
        "Température moyenne : " + averageTemperature + "°C",
        "Total de pluie : " + rainTotal + " mm sur " + rainDays + " jour" + (rainDays >= 2 ? "s" : ""),
        "Total de neige : " + snowTotal + " cm sur " + snowDays + " jour" + (snowDays >= 2 ? "s" : ""),
        "Jours de présence du chat : " + catDays + " jour" + (catDays >= 2 ? "s" : "")
    ].join("\n");
}
