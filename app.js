
import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// =====================================
// MASTER PORTFOLIO - USER WEBSITE
// =====================================

const APPS_COLLECTION = "apps";

// HTML Elements
const appGrid =
  document.getElementById("appGrid") ||
  document.getElementById("appsContainer") ||
  document.getElementById("appList");

const searchInput =
  document.getElementById("searchInput") ||
  document.getElementById("appSearch") ||
  document.getElementById("search");

const loadingElement = document.getElementById("loading");
const emptyElement = document.getElementById("emptyState");
const errorElement = document.getElementById("errorMessage");

// App Data
let allApps = [];

// =====================================
// SAFE HTML ELEMENT CREATION
// =====================================

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = text;
  }

  return element;
}

// =====================================
// MESSAGE HANDLER
// =====================================

function showMessage(element, message) {
  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");
}

function hideMessage(element) {
  if (!element) return;

  element.textContent = "";
  element.classList.add("hidden");
}

// =====================================
// FORMAT DATE
// =====================================

function formatDate(timestamp) {
  if (!timestamp) return "Recently updated";

  try {
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    if (isNaN(date.getTime())) {
      return "Recently updated";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  } catch (error) {
    return "Recently updated";
  }
}

// =====================================
// LOAD ALL APPS FROM FIRESTORE
// =====================================

async function loadApps() {

  if (!appGrid) {
    console.error(
      "App container not found. Add id='appGrid' to index.html."
    );
    return;
  }

  appGrid.innerHTML = "";

  hideMessage(emptyElement);
  hideMessage(errorElement);

  showMessage(loadingElement, "Loading applications...");

  try {

    const appsRef = collection(db, APPS_COLLECTION);

    const snapshot = await getDocs(appsRef);

    allApps = [];

    snapshot.forEach((document) => {

      const data = document.data();

      allApps.push({
        id: document.id,
        ...data
      });

    });

    // Sort by latest updated date
    allApps.sort((a, b) => {

      const dateA = a.updatedAt?.toMillis
        ? a.updatedAt.toMillis()
        : 0;

      const dateB = b.updatedAt?.toMillis
        ? b.updatedAt.toMillis()
        : 0;

      return dateB - dateA;

    });

    hideMessage(loadingElement);

    if (allApps.length === 0) {

      showMessage(
        emptyElement,
        "No applications published yet."
      );

      return;
    }

    renderApps(allApps);

  } catch (error) {

    console.error("Firestore Error:", error);

    hideMessage(loadingElement);

    showMessage(
      errorElement,
      "Unable to load apps. Please check your internet connection and Firestore permissions."
    );

  }

}

// =====================================
// RENDER APP CARDS
// =====================================

function renderApps(apps) {

  appGrid.innerHTML = "";

  hideMessage(emptyElement);

  if (apps.length === 0) {

    showMessage(
      emptyElement,
      "No matching applications found."
    );

    return;
  }

  apps.forEach((app) => {

    const card = createElement("article", "app-card");

    // APP ICON
    const icon = document.createElement("img");

    icon.className = "app-icon";
    icon.alt = app.name || "Application icon";
    icon.loading = "lazy";

    icon.src = app.iconUrl || "";

    icon.onerror = () => {
      icon.src =
        "https://placehold.co/120x120/ffe5f1/e83f8e?text=APP";
    };

    // APP INFORMATION
    const info = createElement("div", "app-info");

    const name = createElement(
      "h3",
      "app-name",
      app.name || "Untitled App"
    );

    const description = createElement(
      "p",
      "app-description",
      app.description || "No description available."
    );

    const version = createElement(
      "span",
      "app-version",
      "Version " + (app.latestVersionName || "N/A")
    );

    const updated = createElement(
      "span",
      "app-updated",
      formatDate(app.updatedAt)
    );

    info.append(
      name,
      description,
      version,
      updated
    );

    // DETAILS BUTTON
    const detailsButton = createElement(
      "button",
      "details-btn",
      "View Versions"
    );

    detailsButton.type = "button";

    // VERSION AREA
    const versionArea = createElement(
      "div",
      "version-area hidden"
    );

    detailsButton.addEventListener("click", async () => {

      const isHidden =
        versionArea.classList.contains("hidden");

      if (isHidden) {

        detailsButton.textContent = "Loading versions...";

        await loadVersions(app.id, versionArea);

        versionArea.classList.remove("hidden");

        detailsButton.textContent = "Hide Versions";

      } else {

        versionArea.classList.add("hidden");

        detailsButton.textContent = "View Versions";

      }

    });

    card.append(
      icon,
      info,
      detailsButton,
      versionArea
    );

    appGrid.appendChild(card);

  });

}

// =====================================
// LOAD APP VERSIONS
// =====================================

async function loadVersions(appId, container) {

  container.innerHTML = "";

  try {

    const versionsRef = collection(
      db,
      APPS_COLLECTION,
      appId,
      "versions"
    );

    const snapshot = await getDocs(versionsRef);

    let versions = [];

    snapshot.forEach((document) => {

      versions.push({
        id: document.id,
        ...document.data()
      });

    });

    // Sort newest version first
    versions.sort((a, b) => {

      return Number(b.versionCode || 0) -
        Number(a.versionCode || 0);

    });

    if (versions.length === 0) {

      container.appendChild(
        createElement(
          "p",
          "no-version",
          "No versions available."
        )
      );

      return;
    }

    versions.forEach((version) => {

      const versionCard = createElement(
        "div",
        "version-card"
      );

      const versionName = createElement(
        "strong",
        "version-title",
        "Version " + (version.versionName || "Unknown")
      );

      const versionCode = createElement(
        "p",
        "version-code",
        "Build: " + (version.versionCode || "N/A")
      );

      const whatsNew = createElement(
        "p",
        "version-notes",
        version.whatsNew || "No update information."
      );

      const downloadButton = createElement(
        "a",
        "download-btn",
        "Download APK"
      );

      downloadButton.href = version.apkUrl || "#";
      downloadButton.target = "_blank";
      downloadButton.rel = "noopener noreferrer";

      if (
        !version.apkUrl ||
        !/^https:\/\//i.test(version.apkUrl)
      ) {

        downloadButton.removeAttribute("href");
        downloadButton.textContent = "Download unavailable";
        downloadButton.classList.add("disabled");

      }

      versionCard.append(
        versionName,
        versionCode,
        whatsNew,
        downloadButton
      );

      container.appendChild(versionCard);

    });

  } catch (error) {

    console.error("Version Loading Error:", error);

    container.appendChild(
      createElement(
        "p",
        "version-error",
        "Unable to load versions. Check Firestore permissions."
      )
    );

  }

}

// =====================================
// SEARCH APPLICATIONS
// =====================================

if (searchInput) {

  searchInput.addEventListener("input", () => {

    const keyword = searchInput.value
      .trim()
      .toLowerCase();

    const filteredApps = allApps.filter((app) => {

      const name = String(app.name || "").toLowerCase();

      const description = String(
        app.description || ""
      ).toLowerCase();

      const packageName = String(
        app.packageName || ""
      ).toLowerCase();

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        packageName.includes(keyword)
      );

    });

    renderApps(filteredApps);

  });

}

// =====================================
// START WEBSITE
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  loadApps();
});

// Also load immediately if DOM is already ready
if (document.readyState !== "loading") {
  loadApps();
}
