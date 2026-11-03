
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    runTransaction,
    increment,
    query,
    orderBy
}
from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const container = document.getElementById("appContainer");
const search = document.getElementById("searchInput");

document.getElementById("year").textContent =
    new Date().getFullYear();

let allApps = [];

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function loadApps() {

    try {

        const snapshot = await getDocs(
            query(collection(db, "apps"), orderBy("updatedAt", "desc"))
        );

        allApps = await Promise.all(
            snapshot.docs.map(async item => {

                const appData = item.data();

                const versionsSnapshot = await getDocs(
                    query(
                        collection(db, "apps", item.id, "versions"),
                        orderBy("versionCode", "desc")
                    )
                );

                const versions = versionsSnapshot.docs.map(v => ({
                    id: v.id,
                    ...v.data()
                }));

                const latest =
                    versions.find(v =>
                        Number(v.versionCode) ===
                        Number(appData.latestVersionCode)
                    ) || versions[0] || null;

                return {
                    id: item.id,
                    ...appData,
                    versions,
                    latest
                };

            })
        );

        renderApps();

    } catch (error) {

        console.error(error);

        container.innerHTML =
            '<div class="empty">Unable to load apps. Check Firebase configuration.</div>';

    }

}

function renderApps() {

    const keyword = search.value.toLowerCase().trim();

    const filtered = allApps.filter(item =>
        (item.name || "").toLowerCase().includes(keyword) ||
        (item.description || "").toLowerCase().includes(keyword)
    );

    document.getElementById("appCount").textContent =
        filtered.length + " Apps";

    if (!filtered.length) {

        container.innerHTML =
            '<div class="empty">No applications found.</div>';

        return;

    }

    container.innerHTML = filtered.map(item => {

        const latest = item.latest;

        return `

        <article class="app-card">

            <div class="app-header">

                <img
                    class="app-icon"
                    src="${escapeHTML(item.iconUrl || "")}"
                    alt="${escapeHTML(item.name)}"
                >

                <div>

                    <div class="app-name">
                        ${escapeHTML(item.name)}
                    </div>

                    <div class="app-version">
                        ${latest ? "LATEST · " + escapeHTML(latest.versionName) : "NO RELEASE"}
                    </div>

                </div>

            </div>

            <p class="app-description">
                ${escapeHTML(item.description || "Explore this application.")}
            </p>

            <div class="app-stats">

                <span>
                    ↓ ${Number(item.downloadCount || 0)}
                </span>

                <span>
                    ${item.updatedAt?.toDate
                        ? item.updatedAt.toDate().toLocaleDateString()
                        : ""}
                </span>

            </div>

            <div class="app-actions">

                ${
                    latest
                    ? `<a class="download-btn"
                         href="${escapeHTML(latest.apkUrl)}"
                         target="_blank"
                         rel="noopener"
                         data-app="${escapeHTML(item.id)}"
                         data-version="${escapeHTML(latest.id)}">
                         Download
                       </a>`
                    : ""
                }

                <button
                    class="versions-btn"
                    data-version-list="${escapeHTML(item.id)}">
                    All Versions
                </button>

            </div>

            <div
                class="version-list"
                id="versions-${escapeHTML(item.id)}"
                hidden>

                ${item.versions.map(v => `

                    <div class="version-item">

                        <span>
                            ${escapeHTML(v.versionName)}
                        </span>

                        <a
                            href="${escapeHTML(v.apkUrl)}"
                            target="_blank"
                            rel="noopener">
                            Download
                        </a>

                    </div>

                `).join("")}

            </div>

        </article>

        `;

    }).join("");

    container.querySelectorAll("[data-version-list]")
        .forEach(button => {

            button.onclick = () => {

                const list = document.getElementById(
                    "versions-" + button.dataset.versionList
                );

                list.hidden = !list.hidden;

            };

        });

    container.querySelectorAll("[data-app]")
        .forEach(button => {

            button.addEventListener("click", () => {

                countDownload(
                    button.dataset.app,
                    button.dataset.version
                );

            });

        });

}

async function countDownload(appId, versionId) {

    try {

        await runTransaction(db, async transaction => {

            const appRef = doc(db, "apps", appId);

            const versionRef = doc(
                db,
                "apps",
                appId,
                "versions",
                versionId
            );

            transaction.update(appRef, {
                downloadCount: increment(1)
            });

            transaction.update(versionRef, {
                downloads: increment(1)
            });

        });

    } catch (error) {

        console.error("Download count error:", error);

    }

}

search.addEventListener("input", renderApps);

loadApps();
