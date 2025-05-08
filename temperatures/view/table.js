async function clearTemperatures() {
    // Get the table
    const table = document.getElementById('temperatures-table');
    // Remove the old tbody if it exists
    const oldTbody = table.querySelector('tbody');
    if (oldTbody) {
        oldTbody.remove();
    }
}

async function displayTemperatures(data) {
    // Get the table
    const table = document.getElementById('temperatures-table');
    // Create the table body
    const tbody = document.createElement('tbody');
    data.sort((a, b) => a.date.localeCompare(b.date));
    data.forEach((item) => {
        const date = item.date;
        const temperature = item.temperature;
        const weather = item.weather;
        const tr = document.createElement('tr');

        const tdDate = document.createElement('td');
        tdDate.appendChild(formatDate(date));
        tr.appendChild(tdDate);

        const tdTemperature = document.createElement('td');
        tdTemperature.textContent = formatTemperature(temperature);
        tr.appendChild(tdTemperature);

        const tdWeather = document.createElement('td');
        const img = document.createElement('img');
        img.src = `icons/${weather}.png`;
        img.alt = weather;
        tdWeather.appendChild(img);
        tdWeather.appendChild(document.createTextNode(WEATHERS[weather] || weather));
        ['wind', 'hail', 'mist'].forEach((condition) => {
            if (item[condition]) {
                const img = document.createElement('img');
                img.src = `icons/${condition}.png`;
                img.alt = condition;
                tdWeather.appendChild(img);
                tdWeather.appendChild(document.createTextNode(WEATHERS[condition] || condition));
            }
        });
        tr.appendChild(tdWeather);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}
