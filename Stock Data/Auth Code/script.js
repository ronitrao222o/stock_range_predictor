// Import Firebase modules (same as before)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Import symbols from your symbols.js module
import { symbols } from "./symbols.js"; // Adjust path if needed
import { generatePineScript } from "./pine.js";

// Firebase config and init (same as before)
const firebaseConfig = {
  apiKey: "AIzaSyDReABzyqeZKUjLlt2M8FrUU3_tFJpW2Ks",
  authDomain: "stock-predictor-5cd33.firebaseapp.com",
  projectId: "stock-predictor-5cd33",
  storageBucket: "stock-predictor-5cd33.firebasestorage.app",
  messagingSenderId: "326361518905",
  appId: "1:326361518905:web:6a0d643faeb99e848c0ee8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements (same as before)
const loginContainer = document.getElementById("login-container");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const symbolForm = document.getElementById("symbol-form");
const stockDataDiv = document.getElementById("stock-data");
const creditsDisplay = document.getElementById("credits-display");
const creditStatus = document.getElementById("credit-status");
const input = document.getElementById("symbol");
const autocompleteList = document.getElementById("autocomplete-list");
const apiBaseUrl = ["http:", "https:"].includes(window.location.protocol)
  ? window.location.origin
  : "http://127.0.0.1:8000";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const loginButton = loginForm.querySelector('button[type="submit"]');
  const loginError = document.getElementById("login-error");
  if (loginButton.disabled) return;

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  loginError.hidden = true;
  loginError.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    loginError.textContent = "Login failed: " + error.message;
    loginError.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).catch((error) => alert("Logout failed: " + error.message));
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginContainer.style.display = "none";
    logoutBtn.style.display = "inline-block";
    symbolForm.style.display = "block";
    creditsDisplay.style.display = "block";
    await showCredits(user);
    stockDataDiv.innerHTML = "Please enter a symbol to view today's trading range.";
  } else {
    loginContainer.style.display = "block";
    logoutBtn.style.display = "none";
    symbolForm.style.display = "none";
    creditsDisplay.style.display = "none";
    creditStatus.style.display = "none";
    stockDataDiv.innerHTML = "Please log in to view today's trading range.";
  }
});

async function showCredits(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const credits = snap.data().credits ?? 0;
    creditsDisplay.textContent = `Credits: ${credits}`;
  } else {
    creditsDisplay.textContent = `Credits: 0`;
  }
}

async function checkAndDeductCredit(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    alert("User credit record not found.");
    return false;
  }

  const credits = snap.data().credits ?? 0;
  if (credits <= 0) {
    alert("No credits left. Please contact support.");
    return false;
  }

  await updateDoc(userRef, { credits: credits - 1 });
  await showCredits(user);
  showCreditStatus(`✅ 1 credit used. ${credits - 1} credits remaining.`);
  return true;
}

function showCreditStatus(message) {
  creditStatus.textContent = message;
  creditStatus.style.display = "block";
  setTimeout(() => {
    creditStatus.style.display = "none";
  }, 5000);
}

// ------------- AUTOCOMPLETE LOGIC ----------------

// Clear all autocomplete suggestions
function closeAllLists() {
  while (autocompleteList.firstChild) {
    autocompleteList.removeChild(autocompleteList.firstChild);
  }
}

// Remove active class from suggestions
function removeActive(items) {
  for (const item of items) {
    item.classList.remove("autocomplete-active");
  }
}

// Add active class to the currently selected item
function addActive(items, index) {
  if (!items.length) return false;
  removeActive(items);
  if (index >= items.length) index = 0;
  if (index < 0) index = items.length - 1;
  items[index].classList.add("autocomplete-active");
  return index;
}

let currentFocus = -1;

input.addEventListener("input", function () {
  const val = this.value.trim().toUpperCase();
  closeAllLists();
  currentFocus = -1;
  if (!val) return;

  const maxResults = 10;

  const fragment = document.createDocumentFragment();

  let count = 0;
  for (const { symbol, name } of symbols) {
    if (
      (symbol.startsWith(val) || name.toUpperCase().includes(val)) &&
      count < maxResults
    ) {
      const item = document.createElement("div");
      // Highlight matched part of symbol
      const symbolHighlight = `<strong>${symbol.substr(0, val.length)}</strong>${symbol.substr(val.length)}`;
      item.innerHTML = `${symbolHighlight} — ${name}`;
      item.classList.add("autocomplete-item");
      item.addEventListener("click", () => {
        input.value = symbol;
        closeAllLists();
      });
      fragment.appendChild(item);
      count++;
    }
  }

  if (count > 0) {
    autocompleteList.appendChild(fragment);
  }
});

input.addEventListener("keydown", function (e) {
  const items = autocompleteList.getElementsByTagName("div");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    currentFocus++;
    currentFocus = addActive(items, currentFocus);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    currentFocus--;
    currentFocus = addActive(items, currentFocus);
    e.preventDefault();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentFocus > -1) {
      if (items[currentFocus]) items[currentFocus].click();
    }
  }
});

// Close autocomplete when clicking outside
document.addEventListener("click", function (e) {
  if (e.target !== input) {
    closeAllLists();
  }
});

// ------------- END AUTOCOMPLETE ----------------

// Symbol form submit logic (same as before)
symbolForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fetchBtn = symbolForm.querySelector("button");
  fetchBtn.disabled = true;
  fetchBtn.textContent = "Fetching...";

  const symbol = input.value.trim().toUpperCase();
  if (!/^[A-Z0-9&-]+$/.test(symbol)) {
    alert("Please enter a valid NSE stock symbol.");
    fetchBtn.disabled = false;
    fetchBtn.textContent = "Fetch Data";
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in.");
    fetchBtn.disabled = false;
    fetchBtn.textContent = "Fetch Data";
    return;
  }

  try {
    const allowed = await checkAndDeductCredit(user);
    if (!allowed) return;

    stockDataDiv.textContent = "Loading data...";

    const prevDayResponse = await fetch(
      `${apiBaseUrl}/previous-day-ohlc/?symbol=${encodeURIComponent(symbol)}`
    );
    if (!prevDayResponse.ok) throw new Error("Previous day data not found");
    const prevDayData = await prevDayResponse.json();

    const sdResponse = await fetch(
      `${apiBaseUrl}/std-deviation/?symbol=${encodeURIComponent(symbol)}`
    );
    if (!sdResponse.ok) throw new Error("Standard deviation data not found");
    const sdData = await sdResponse.json();

    renderPriceInputForm(prevDayData, sdData);
  } catch (error) {
    const errorMessage = document.createElement("p");
    errorMessage.style.color = "red";
    errorMessage.textContent = `Error: ${error.message}`;
    stockDataDiv.replaceChildren(errorMessage);
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = "Fetch Data";
  }
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

  stockDataDiv.innerHTML = html;

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

  showRangeScales(sdData, close);
}

function showRangeScales(sdData, currentPrice) {
  const { one_sdh, one_sdl, two_sdh, two_sdl, three_sdh, three_sdl } = sdData;

  // Close price fallback for Range 1 info box calculations
  const closePrice = sdData.close ?? currentPrice;

  // Range 1 drawing levels
  const H100 = one_sdh.toFixed(2);
  const H50 = ((one_sdh + closePrice) / 2).toFixed(2);
  const Center = closePrice.toFixed(2);
  const L50 = ((closePrice + one_sdl) / 2).toFixed(2);
  const L100 = one_sdl.toFixed(2);

  // Range 2 drawing levels
  const H200 = two_sdh.toFixed(2);
  const H150 = ((two_sdh + one_sdh) / 2).toFixed(2);
  const L150 = ((two_sdl + one_sdl) / 2).toFixed(2);
  const L200 = two_sdl.toFixed(2);

  // Range 3 drawing levels
  const H300 = three_sdh.toFixed(2);
  const H250 = ((three_sdh + two_sdh) / 2).toFixed(2);
  const L250 = ((three_sdl + two_sdl) / 2).toFixed(2);
  const L300 = three_sdl.toFixed(2);

  const makeScale = (label, low, high, id) => {
    const clampedPrice = Math.min(Math.max(currentPrice, low), high);
    const percent = ((high - clampedPrice) / (high - low)) * 100;
    const inRange = currentPrice >= low && currentPrice <= high;
    const fromHigh = (high - currentPrice).toFixed(2);
    const fromLow = (currentPrice - low).toFixed(2);
    const status = inRange ? "✅ In Range" : currentPrice < low ? "⬇️ Below Range" : "⬆️ Above Range";

    return `
      <div class="range-block" id="range-${id}">
        <h3>${label} <span class="range-status">(${status})</span></h3>
        <div class="scale-bar">
          <span class="label high-label">₹${high}</span>
          <div class="scale-track">
            <div class="covered-bar" style="width: ${percent}%;"></div>
            <div class="current-marker" style="left: ${percent}%;"
              title="Current Price: ₹${clampedPrice.toFixed(2)}"></div>
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

  // Info boxes for each range
  const range1InfoBox = `
    <div class="info-box">
      <h4>Draw Levels for Range 1</h4>
      <ul>
        <li><strong>H100</strong>: ₹${H100}</li>
        <li><strong>H50</strong>: ₹${H50}</li>
        <li><strong>Center</strong>: ₹${Center}</li>
        <li><strong>L50</strong>: ₹${L50}</li>
        <li><strong>L100</strong>: ₹${L100}</li>
      </ul>
      <p>Use these levels to draw lines on your TradingView chart.</p>
    </div>
  `;

  const range2InfoBox = `
    <div class="info-box">
      <h4>Draw Levels for Range 2</h4>
      <ul>
        <li><strong>H200</strong>: ₹${H200}</li>
        <li><strong>H150</strong>: ₹${H150}</li>
        <li><strong>L150</strong>: ₹${L150}</li>
        <li><strong>L200</strong>: ₹${L200}</li>
      </ul>
      <p>Use these levels to draw lines on your TradingView chart.</p>
    </div>
  `;

  const range3InfoBox = `
    <div class="info-box">
      <h4>Draw Levels for Range 3</h4>
      <ul>
        <li><strong>H300</strong>: ₹${H300}</li>
        <li><strong>H250</strong>: ₹${H250}</li>
        <li><strong>L250</strong>: ₹${L250}</li>
        <li><strong>L300</strong>: ₹${L300}</li>
      </ul>
      <p>Use these levels to draw lines on your TradingView chart.</p>
    </div>
  `;

  stockDataDiv.querySelector("#range-display").innerHTML = `
    ${makeScale("Range 1", one_sdl, one_sdh, "1")}
    ${range1InfoBox}
    ${makeScale("Range 2", two_sdl, two_sdh, "2")}
    ${range2InfoBox}
    ${makeScale("Range 3", three_sdl, three_sdh, "3")}
    ${range3InfoBox}
    <div class="info-box" id="pine-script-output">
      <h4>TradingView Pine Script</h4>
      <p>Copy this script into TradingView's Pine Editor.</p>
      <button type="button" id="copy-pine-btn">Copy Pine Script</button>
      <pre id="pine-script-code"></pre>
      <p id="copy-pine-status" role="status" aria-live="polite"></p>
    </div>
  `;

  const pineScript = generatePineScript(
    { one_sdh, one_sdl, two_sdh, two_sdl, three_sdh, three_sdl },
    closePrice,
  );
  const pineScriptCode = stockDataDiv.querySelector("#pine-script-code");
  const copyPineButton = stockDataDiv.querySelector("#copy-pine-btn");
  const copyPineStatus = stockDataDiv.querySelector("#copy-pine-status");

  pineScriptCode.textContent = pineScript;
  copyPineButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pineScript);
      copyPineStatus.textContent = "Pine Script copied to clipboard.";
    } catch (error) {
      copyPineStatus.textContent = "Copy failed. Select the script manually.";
      console.error("Unable to copy Pine Script:", error);
    }
  });
}
