import { db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const ngoListEl = document.getElementById("ngo-list");
const searchInput = document.getElementById("search-bar");
const categorySelect = document.getElementById("filter-category");

const feedbackForm = document.getElementById("feedback-form");
const feedbackStatus = document.getElementById("feedback-status");

const ngosCol = collection(db, "ngos");

function createNgoCard(docId, ngo) {
  const card = document.createElement("div");
  card.className = "card ngo-card";
  card.dataset.id = docId;
  card.dataset.category = (ngo.category || "").toLowerCase();
  card.dataset.text = [ngo.name, ngo.description, ngo.contact]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const name = document.createElement("h3");
  name.textContent = ngo.name || "Unnamed";

  const category = document.createElement("span");
  category.className = "badge";
  category.textContent = ngo.category || "Uncategorized";

  const description = document.createElement("p");
  description.textContent = ngo.description || "";

  const linksRow = document.createElement("div");
  linksRow.className = "row";
  if (ngo.website) {
    const a = document.createElement("a");
    a.href = ngo.website;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "btn";
    a.textContent = "Website";
    linksRow.appendChild(a);
  }
  if (ngo.donationLink) {
    const a = document.createElement("a");
    a.href = ngo.donationLink;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "btn primary";
    a.textContent = "Donate";
    linksRow.appendChild(a);
  }

  card.appendChild(name);
  card.appendChild(category);
  card.appendChild(description);
  if (linksRow.children.length) card.appendChild(linksRow);
  return card;
}

function applyClientFilters() {
  const term = (searchInput.value || "").trim().toLowerCase();
  const cat = (categorySelect.value || "").toLowerCase();
  const cards = ngoListEl.children;
  for (const el of cards) {
    const matchesText = !term || el.dataset.text.includes(term);
    const matchesCat = !cat || el.dataset.category === cat;
    el.style.display = matchesText && matchesCat ? "grid" : "none";
  }
}

function renderNgos(docs) {
  ngoListEl.innerHTML = "";
  let lastCategory = null;
  docs.forEach(d => {
    const data = d.data();
    const currentCat = (data.category || "").toLowerCase();
    if (currentCat && currentCat !== lastCategory) {
      const h2 = document.createElement("h2");
      h2.textContent = data.category;
      ngoListEl.appendChild(h2);
      lastCategory = currentCat;
    }
    ngoListEl.appendChild(createNgoCard(d.id, data));
  });
  applyClientFilters();
}

// Live read of NGOs (ordered by category for grouping)
onSnapshot(query(ngosCol, orderBy("category")), (snapshot) => {
  renderNgos(snapshot.docs);
});

// Client-side search and filter
searchInput.addEventListener("input", applyClientFilters);
categorySelect.addEventListener("change", applyClientFilters);

// Feedback submission
feedbackForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  feedbackStatus.textContent = "Submitting...";
  const form = new FormData(feedbackForm);
  const payload = {
    suggestedName: form.get("suggestedName"),
    userEmail: form.get("userEmail"),
    reason: form.get("reason"),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  try {
    await addDoc(collection(db, "feedback"), payload);
    feedbackForm.reset();
    feedbackStatus.textContent = "Thank you! Your suggestion was submitted.";
  } catch (err) {
    feedbackStatus.textContent = "Error submitting feedback. Please try again.";
    console.error(err);
  }
});


