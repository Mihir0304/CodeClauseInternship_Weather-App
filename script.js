let controller;

document.getElementById('weather-form').addEventListener('submit', function(e) {
    e.preventDefault();
    getWeather();
});

async function getWeather() {
    const city = document.getElementById("city").value.trim();
    const apiKey = "93261013c737c1163186530470a2fc95"; // Replace with your API key
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    const weatherInfo = document.getElementById("weather-info");
    const forecastInfo = document.getElementById("forecast-info");
    const loader = document.getElementById("loader");
    const errorMessage = document.getElementById("error-message");

    weatherInfo.innerHTML = "";
    forecastInfo.innerHTML = "";
    errorMessage.textContent = "";
    loader.style.display = "block";

    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    try {
        // Fetch current weather and forecast in parallel
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentUrl, { signal }),
            fetch(forecastUrl, { signal })
        ]);
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        loader.style.display = "none";

        if (currentData.cod === 200 && forecastData.cod === "200") {
            // Show current weather
            const iconCode = currentData.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

            weatherInfo.innerHTML = `
                <h3>${currentData.name}, ${currentData.sys.country}</h3>
                <img src="${iconUrl}" alt="Weather Icon">
                <p><strong>${currentData.weather[0].main}</strong> - ${capitalize(currentData.weather[0].description)}</p>
                <p>🌡️ Temperature: <strong>${Math.round(currentData.main.temp)}°C</strong></p>
                <p>💧 Humidity: <strong>${currentData.main.humidity}%</strong></p>
                <p>💨 Wind: <strong>${currentData.wind.speed} m/s</strong></p>
            `;
            weatherInfo.style.opacity = 0;
            setTimeout(() => { weatherInfo.style.opacity = 1; }, 100);

            // Process forecast: group by day, pick the forecast closest to 12:00
            const daily = {};
            forecastData.list.forEach(item => {
                const date = item.dt_txt.split(" ")[0];
                if (!daily[date]) daily[date] = [];
                daily[date].push(item);
            });

            // Get today's date to skip it
            const today = (new Date()).toISOString().split("T")[0];
            const days = Object.keys(daily).filter(date => date !== today).slice(0, 5);

            forecastInfo.innerHTML = `<h4 style="margin-bottom:10px;color:#1976d2;">Next 5 Days Forecast</h4>`;
            days.forEach(date => {
                // Find the forecast closest to 12:00
                let noonForecast = daily[date].reduce((prev, curr) => {
                    return Math.abs(new Date(curr.dt_txt).getHours() - 12) < Math.abs(new Date(prev.dt_txt).getHours() - 12) ? curr : prev;
                });
                const icon = noonForecast.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                const temp = Math.round(noonForecast.main.temp);
                const desc = capitalize(noonForecast.weather[0].description);
                const weekday = (new Date(date)).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

                forecastInfo.innerHTML += `
                    <div class="forecast-day">
                        <div class="forecast-date">${weekday}</div>
                        <img src="${iconUrl}" alt="icon">
                        <div class="forecast-info-details">
                            <div><strong>${desc}</strong></div>
                            <div>🌡️ ${temp}°C</div>
                            <div>💧 ${noonForecast.main.humidity}%</div>
                            <div>💨 ${noonForecast.wind.speed} m/s</div>
                        </div>
                    </div>
                `;
            });

        } else {
            errorMessage.textContent = "City not found! Please try again.";
        }
    } catch (error) {
        loader.style.display = "none";
        if (error.name === "AbortError") {
            // Previous request aborted.
        } else {
            errorMessage.textContent = "Error fetching data. Please try again!";
            console.error("Error:", error);
        }
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
