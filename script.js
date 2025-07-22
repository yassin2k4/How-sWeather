const apiKey = "3f2d3636f74c19666147dc2832cfc9c0"; // OpenWeatherMap API key
const blackboxApiKey = "AIzaSyBt9cImauFVgBZsaOurIjLjLQL8gfmS_0g"; // Blackbox API key
let currentWeather = null; // Store current weather data for chatbot
let currentCity = ""; // Store current city for chatbot context

async function fetchCitySuggestions() {
    const input = document.getElementById("cityInput").value.trim();
    const suggestionsContainer = document.getElementById("suggestions");

    if (input.length < 3) {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.classList.remove("active");
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&featuretype=city&limit=5`);
        const data = await response.json();

        suggestionsContainer.innerHTML = "";
        if (data.length > 0) {
            data.forEach(item => {
                const suggestion = document.createElement("div");
                suggestion.className = "suggestion-item";
                suggestion.textContent = item.display_name.split(",")[0];
                suggestion.onclick = () => {
                    document.getElementById("cityInput").value = item.display_name.split(",")[0];
                    suggestionsContainer.innerHTML = "";
                    suggestionsContainer.classList.remove("active");
                    getWeather();
                };
                suggestionsContainer.appendChild(suggestion);
            });
            suggestionsContainer.classList.add("active");
        } else {
            suggestionsContainer.classList.remove("active");
        }
    } catch (err) {
        console.error(err);
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.classList.remove("active");
    }
}

async function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    const weatherInfo = document.getElementById("weatherInfo");
    const errorMessage = document.getElementById("errorMessage");
    const button = document.querySelector(".search-bar button");

    if (!city) {
        errorMessage.textContent = "Please enter a city name.";
        errorMessage.style.display = "block";
        return;
    }

    // Reset UI
    errorMessage.style.display = "none";
    weatherInfo.style.opacity = "0.5";
    button.disabled = true;
    button.innerHTML = `<svg class="spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="white" stroke-width="4"></circle></svg>`;

    try {
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const res = await fetch(currentUrl);
        const data = await res.json();

        if (data.cod !== 200) {
            errorMessage.textContent = "City not found. Please try again.";
            errorMessage.style.display = "block";
            weatherInfo.style.opacity = "1";
            button.disabled = false;
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
            return;
        }

        currentWeather = data; // Store weather data for chatbot
        currentCity = city; // Store city name
        const { temp, humidity } = data.main;
        const description = data.weather[0].description;
        const wind = data.wind.speed;
        const mainWeather = data.weather[0].main;
        const lat = data.coord.lat;
        const lon = data.coord.lon;

        document.getElementById("cityName").textContent = `📍 ${city}`;
        document.getElementById("temperature").textContent = `${Math.round(temp)}°C`;
        document.getElementById("description").textContent = `${description}`;
        document.getElementById("humidity").textContent = `Humidity: ${humidity}%`;
        document.getElementById("wind").textContent = `Wind: ${wind} km/h`;

        // Background switcher
        const body = document.body;
        body.className = "";
        switch (mainWeather) {
            case "Clear":
                body.classList.add("sunny");
                break;
            case "Clouds":
                body.classList.add("clouds");
                break;
            case "Rain":
            case "Drizzle":
                body.classList.add("rain");
                break;
            case "Thunderstorm":
                body.classList.add("storm");
                break;
            case "Snow":
                body.classList.add("snow");
                break;
            case "Haze":
                body.classList.add("haze");
                break;
            default:
                body.classList.add("default-bg");
        }

        // Fetch 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        displayForecast(forecastData.list);

        weatherInfo.style.opacity = "1";
        button.disabled = false;
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    } catch (err) {
        console.error(err);
        errorMessage.textContent = "Something went wrong. Please try again later.";
        errorMessage.style.display = "block";
        weatherInfo.style.opacity = "1";
        button.disabled = false;
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    }
}

function displayForecast(list) {
    const forecastContainer = document.getElementById("forecast");
    forecastContainer.innerHTML = "";

    // Filter the forecast to one item per day (12:00 PM)
    const dailyForecasts = list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.slice(0, 5).forEach(item => {
        const date = new Date(item.dt_txt);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const temp = Math.round(item.main.temp);
        const description = item.weather[0].description;

        forecastContainer.innerHTML += `
            <div class="forecast-item">
                <p>${dayName}</p>
                <p>${temp}°C</p>
                <p>${description}</p>
            </div>
        `;
    });
}

function toggleChat() {
    const chatContainer = document.getElementById("chatContainer");
    chatContainer.classList.toggle("active");
    if (chatContainer.classList.contains("active")) {
        document.getElementById("chatInput").focus();
    }
}

async function sendChatMessage() {
    const chatInput = document.getElementById("chatInput");
    const chatBody = document.getElementById("chatBody");
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message
    const userMessage = document.createElement("div");
    userMessage.className = "chat-message user";
    userMessage.textContent = message;
    chatBody.appendChild(userMessage);

    // Generate bot response using Hugging Face API
    const botMessage = document.createElement("div");
    botMessage.className = "chat-message bot";
    try {
        const response = await getBlackboxResponse(message);
        botMessage.textContent = response;
    } catch (err) {
        console.error(err);
        botMessage.textContent = "Sorry, I couldn't process your request. Please try again later.";
    }
    chatBody.appendChild(botMessage);

    // Clear input and scroll to bottom
    chatInput.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function getBlackboxResponse(message) {
    if (!currentWeather || !currentCity) {
        return "Please search for a city's weather first.";
    }

    const { temp, humidity } = currentWeather.main;
    const description = currentWeather.weather[0].description;
    const wind = currentWeather.wind.speed;

    const prompt = `
You are a friendly AI weather assistant.

Here is the current weather in ${currentCity}:
- 🌡️ Temperature: ${Math.round(temp)}°C
- 🌥️ Condition: ${description}
- 💧 Humidity: ${humidity}%
- 🌬️ Wind: ${wind} km/h

The user asked: "${message}"

---

🔧 **Instructions:**
Respond with a helpful and structured answer using the following format:
1. **🌞 UV Risk:** Short sentence.
2. **🧴 Protection Tips:** 3 clear bullet points.
3. **🥵 Heatstroke Warning:** A one-liner if needed.
4. **🧊 Final Tip:** Encourage hydration or indoor breaks.

Keep it clear, no waffle. Use markdown-style bullets and emojis.
`;

    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": blackboxApiKey  // ✅ This is the correct header!
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        console.log("🌩️ Gemini Response:", data);

        if (
            data.candidates &&
            data.candidates.length > 0 &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0
        ) {
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            return `⚠️ Gemini gave a weird response:\n${JSON.stringify(data, null, 2)}`;
        }
    } catch (err) {
        console.error("🚫 Gemini API error:", err);
        return "Connection failed. Try again in a bit.";
    }
}




// Add Enter key support for chat and search
document.getElementById("cityInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        document.getElementById("suggestions").innerHTML = "";
        document.getElementById("suggestions").classList.remove("active");
        getWeather();
    }
});

document.getElementById("chatInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendChatMessage();
    }
});

// Initial animation
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".card").style.transform = "scale(0.95)";
    setTimeout(() => {
        document.querySelector(".card").style.transform = "scale(1)";
    }, 300);
});