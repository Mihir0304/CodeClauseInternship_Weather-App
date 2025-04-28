let controller;

document.getElementById('weather-form').addEventListener('submit', function(e) {
    e.preventDefault();
    getWeather();
});

async function getWeather() {
    const city = document.getElementById("city").value.trim();
    const apiKey = "93261013c737c1163186530470a2fc95"; // Replace with your API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    const weatherInfo = document.getElementById("weather-info");
    const loader = document.getElementById("loader");
    const errorMessage = document.getElementById("error-message");

    weatherInfo.innerHTML = "";
    errorMessage.textContent = "";
    loader.style.display = "block";

    if (controller) controller.abort();
    controller = new AbortController();
    const signal = controller.signal;

    try {
        const response = await fetch(url, { signal });
        const data = await response.json();

        loader.style.display = "none";

        if (data.cod === 200) {
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

            weatherInfo.innerHTML = `
                <h3>${data.name}, ${data.sys.country}</h3>
                <img src="${iconUrl}" alt="Weather Icon">
                <p><strong>${data.weather[0].main}</strong> - ${capitalize(data.weather[0].description)}</p>
                <p>🌡️ Temperature: <strong>${Math.round(data.main.temp)}°C</strong></p>
                <p>💧 Humidity: <strong>${data.main.humidity}%</strong></p>
                <p>💨 Wind: <strong>${data.wind.speed} m/s</strong></p>
            `;
            weatherInfo.style.opacity = 0;
            setTimeout(() => { weatherInfo.style.opacity = 1; }, 100);
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
