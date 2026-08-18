document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("symbol-form");
  const stockDataDiv = document.getElementById("stock-data");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const symbol = document.getElementById("symbol").value.trim().toUpperCase();
    if (!symbol) return;

    stockDataDiv.innerHTML = "Loading data...";

    try {
      const prevDayResponse = await fetch(`https://api.productsreview.in:444/previous-day-ohlc/?symbol=${symbol}`);
      if (!prevDayResponse.ok) throw new Error("Previous day data not found");
      const prevDayData = await prevDayResponse.json();

      const sdResponse = await fetch(`https://api.productsreview.in:444/std-deviation/?symbol=${symbol}`);
      if (!sdResponse.ok) throw new Error("Standard deviation data not found");
      const sdData = await sdResponse.json();

      renderPriceInputForm(prevDayData, sdData);

    } catch (error) {
      stockDataDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
      console.error(error);
    }
  });
});

function renderPriceInputForm(prevDayData, sdData) {
  const { symbol, date, close } = prevDayData;

  const html = `
    <h2>${symbol} — Today's Trading Range</h2>
    <p><strong>Closing Date:</strong> ${date}</p>
    <p><strong>Yesterday's Closing Price:</strong> ₹${close}</p>

    <form id="price-form">
      <label for="current-price">Enter Current Stock Price (optional):</label>
      <input type="number" id="current-price" step="0.01" placeholder="Leave blank to use ₹${close}" />
      <button type="submit">Show Range Details</button>
    </form>

    <div id="range-display"></div>
  `;

  document.getElementById("stock-data").innerHTML = html;

  document.getElementById("price-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const priceInput = document.getElementById("current-price").value.trim();
    const currentPrice = priceInput === "" ? close : parseFloat(priceInput);

    if (isNaN(currentPrice)) {
      alert("Invalid price entered.");
      return;
    }

    showRangeScales(sdData, currentPrice);
  });

  // Auto-show on page load with yesterday's close
  showRangeScales(sdData, close);
}

function showRangeScales(sdData, currentPrice) {
  const { one_sdh, one_sdl, two_sdh, two_sdl, three_sdh, three_sdl } = sdData;

  const makeScale = (label, low, high, id) => {
    // Clamp currentPrice inside low-high range
    const clampedPrice = Math.min(Math.max(currentPrice, low), high);

    // Calculate % position from High → Low (0% = High, 100% = Low)
    const percent = ((high - clampedPrice) / (high - low)) * 100;

    const inRange = currentPrice >= low && currentPrice <= high;
    const fromHigh = (high - currentPrice).toFixed(2);
    const fromLow = (currentPrice - low).toFixed(2);
    const status = inRange ? "✅ In Range" : (currentPrice < low ? "⬇️ Below Range" : "⬆️ Above Range");

    return `
      <div class="range-block" id="range-${id}">
        <h3>${label} <span class="range-status">(${status})</span></h3>
        <div class="scale-bar">
          <span class="label high-label">₹${high}</span>
          <div class="scale-track">
            <div 
              class="covered-bar" 
              style="width: ${percent}%;"
            ></div>
            <div 
              class="current-marker" 
              style="left: ${percent}%;"
              title="Current Price: ₹${clampedPrice.toFixed(2)}"
            ></div>
          </div>
          <span class="label low-label">₹${low}</span>
        </div>
        <p>
          📉 From High: ₹${fromHigh} <br>
          📈 From Low: ₹${fromLow}
        </p>
      </div>
    `;
  };

  const html = `
    <h3>Current Price Used: ₹${currentPrice}</h3>
    ${makeScale("Range 1", one_sdl, one_sdh, "r1")}
    ${makeScale("Range 2", two_sdl, two_sdh, "r2")}
    ${makeScale("Range 3", three_sdl, three_sdh, "r3")}
  `;

  document.getElementById("range-display").innerHTML = html;
}
