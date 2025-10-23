import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const adminActions = document.getElementById("admin-actions");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const signOutBtn = document.getElementById("sign-out");

const ngoForm = document.getElementById("ngo-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit");
const formStatus = document.getElementById("form-status");
const ngoTableBody = document.getElementById("ngo-table");

const feedbackList = document.getElementById("feedback-list");

const ngosCol = collection(db, "ngos");
const feedbackCol = collection(db, "feedback");

let editDocId = null;

function setAuthUI(isSignedIn) {
  loginSection.style.display = isSignedIn ? "none" : "block";
  dashboard.style.display = isSignedIn ? "block" : "none";
  adminActions.style.display = isSignedIn ? "flex" : "none";
}

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? "signed in" : "signed out");
  if (user) {
    console.log("User email:", user.email);
    console.log("User UID:", user.uid);
  }
  setAuthUI(!!user);
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginStatus.textContent = "Signing in...";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Sign in successful:", userCredential.user.email);
    loginStatus.textContent = "Signed in successfully!";
  } catch (err) {
    console.error("Sign in error:", err);
    loginStatus.textContent = `Error: ${err.message}`;
  }
});

signOutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

function readFormValues() {
  return {
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    contact: document.getElementById("contact").value.trim(),
    website: document.getElementById("website").value.trim(),
    donationLink: document.getElementById("donationLink").value.trim(),
    description: document.getElementById("description").value.trim()
  };
}

function setFormValues(ngo) {
  document.getElementById("name").value = ngo.name || "";
  document.getElementById("category").value = ngo.category || "education";
  document.getElementById("contact").value = ngo.contact || "";
  document.getElementById("website").value = ngo.website || "";
  document.getElementById("donationLink").value = ngo.donationLink || "";
  document.getElementById("description").value = ngo.description || "";
}

function switchToCreateMode() {
  editDocId = null;
  formTitle.textContent = "Add NGO";
  submitBtn.textContent = "Add";
  cancelEditBtn.style.display = "none";
  formStatus.textContent = "";
  ngoForm.reset();
}

function switchToEditMode(docId, ngo) {
  editDocId = docId;
  formTitle.textContent = "Edit NGO";
  submitBtn.textContent = "Update";
  cancelEditBtn.style.display = "inline-flex";
  formStatus.textContent = "";
  setFormValues(ngo);
}

cancelEditBtn.addEventListener("click", switchToCreateMode);

ngoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = editDocId ? "Updating..." : "Adding...";
  const values = readFormValues();
  try {
    if (editDocId) {
      await updateDoc(doc(db, "ngos", editDocId), values);
      switchToCreateMode();
    } else {
      await addDoc(ngosCol, values);
      ngoForm.reset();
    }
    formStatus.textContent = "Saved.";
  } catch (err) {
    console.error(err);
    formStatus.textContent = "Error saving. See console.";
  }
});

function renderTable(snapshotDocs) {
  ngoTableBody.innerHTML = "";
  snapshotDocs.forEach(d => {
    const data = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.name || ""}</td>
      <td><span class="badge">${data.category || ""}</span></td>
      <td>${data.contact || ""}</td>
      <td>${data.website ? `<a href="${data.website}" target="_blank" rel="noopener">Website</a>` : ""}</td>
      <td>${data.donationLink ? `<a href="${data.donationLink}" target="_blank" rel="noopener">Donate</a>` : ""}</td>
      <td>${data.description || ""}</td>
      <td>
        <div class="row">
          <button class="btn" data-action="edit" data-id="${d.id}">Edit</button>
          <button class="btn danger" data-action="delete" data-id="${d.id}">Delete</button>
        </div>
      </td>
    `;
    ngoTableBody.appendChild(tr);
  });
}

// Live read NGOs
onSnapshot(query(ngosCol, orderBy("name")), (snapshot) => {
  renderTable(snapshot.docs);
});

// Live read feedback
onSnapshot(query(feedbackCol, orderBy("createdAt")), (snapshot) => {
  feedbackList.innerHTML = "";
  snapshot.docs.forEach(d => {
    const f = d.data();
    const item = document.createElement("div");
    item.className = "card";
    item.innerHTML = `
      <div class="row" style="justify-content: space-between; align-items: start; gap: 16px;">
        <div>
          <strong>${f.suggestedName || "(no name)"}</strong>
          <div class="badge" style="margin-left:8px">${f.status || "pending"}</div>
          <div class="muted">${f.userEmail || ""}</div>
          <p>${f.reason || ""}</p>
        </div>
      </div>
    `;
    feedbackList.appendChild(item);
  });
});

// Table actions (edit/delete)
ngoTableBody.addEventListener("click", async (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  if (!action || !id) return;
  if (action === "delete") {
    const yes = confirm("Delete this NGO?");
    if (!yes) return;
    try { await deleteDoc(doc(db, "ngos", id)); } catch (err) { console.error(err); }
    return;
  }
  if (action === "edit") {
    try {
      const snap = await getDoc(doc(db, "ngos", id));
      if (snap.exists()) {
        switchToEditMode(id, snap.data());
      }
    } catch (err) { console.error(err); }
  }
});


