// Firebase v10 modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* Your Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyB4D531Uj4SGql8pkaXPKZvdHa5XFby2LU",
  authDomain: "hawaa-df1cc.firebaseapp.com",
  projectId: "hawaa-df1cc",
  storageBucket: "hawaa-df1cc.firebasestorage.app",
  messagingSenderId: "547302517440",
  appId: "1:547302517440:web:9ef37f89e74cac785f9b25",
  measurementId: "G-C3T5G8W7H7"
};

// Init
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch(_) {}
const auth = getAuth(app);
const db   = getFirestore(app);

// Elements
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const dobInput = document.getElementById("dob");
const genderInput = document.getElementById("gender");
const nationalityInput = document.getElementById("nationality");
const addressInput = document.getElementById("address");
const cityInput = document.getElementById("city");
const phoneInput = document.getElementById("phone");
const profileForm = document.getElementById("profile-form");
const ordersList = document.getElementById("orders-list");
const saveBtn = document.querySelector(".save-btn");

// Header
const headerName = document.querySelector(".profile-info h2");
const headerSub  = document.querySelector(".profile-info p");
const avatarEl   = document.querySelector(".avatar-initial");

// Mobile tabs
const mTabPersonal = document.getElementById("m-tab-personal");
const mTabOrders   = document.getElementById("m-tab-orders");

// Sidebar tabs
const personalTab = document.getElementById("personal-tab");
const ordersTab   = document.getElementById("orders-tab");

// Track originals for "Update" button
let originalValues = {};

// Helpers
function updateAvatarInitial() {
  const basis = (nameInput?.value || emailInput?.value || phoneInput?.value || "").trim();
  const ch = basis ? basis.charAt(0).toUpperCase() : "U";
  if (avatarEl) avatarEl.textContent = /[A-Z]/.test(ch) ? ch : "U";
}
function checkFormChanges() {
  const changed = Object.keys(originalValues).some(k => {
    const el = document.getElementById(k);
    return el && (el.value !== (originalValues[k] ?? ""));
  });
  if (saveBtn) saveBtn.disabled = !changed;
}
function switchTab(targetId){
  const personal = document.getElementById("personal-info");
  const orders   = document.getElementById("orders");

  if (targetId === "personal-info") {
    personal.classList.add("active"); orders.classList.remove("active");
    personalTab?.classList.add("active"); ordersTab?.classList.remove("active");
    mTabPersonal?.classList.add("active"); mTabOrders?.classList.remove("active");
    mTabPersonal?.setAttribute("aria-selected","true"); mTabOrders?.setAttribute("aria-selected","false");
  } else {
    personal.classList.remove("active"); orders.classList.add("active");
    ordersTab?.classList.add("active"); personalTab?.classList.remove("active");
    mTabOrders?.classList.add("active"); mTabPersonal?.classList.remove("active");
    mTabOrders?.setAttribute("aria-selected","true"); mTabPersonal?.setAttribute("aria-selected","false");
  }
}

// Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Prefill only when available (no dummy)
  if (emailInput && user.email) emailInput.value = user.email;
  if (phoneInput && user.phoneNumber) phoneInput.value = user.phoneNumber;

  // Load profile
  const uref = doc(db, "users", user.uid);
  const usnap = await getDoc(uref);

  if (usnap.exists()) {
    const d = usnap.data();
    if (nameInput && d.name) nameInput.value = d.name;
    if (dobInput && d.dob) dobInput.value = d.dob;
    if (genderInput && d.gender) genderInput.value = d.gender;
    if (nationalityInput && d.nationality) nationalityInput.value = d.nationality;
    if (addressInput && d.address) addressInput.value = d.address;
    if (cityInput && d.city) cityInput.value = d.city;
    if (phoneInput && !phoneInput.value && d.phone) phoneInput.value = d.phone;
    if (emailInput && !emailInput.value && d.email) emailInput.value = d.email;

    if (headerName && d.name) headerName.textContent = d.name;
    if (headerSub && (d.email || user.email || user.phoneNumber)) headerSub.textContent = d.email || user.email || user.phoneNumber || "";
  }

  originalValues = {
    name: nameInput?.value || "",
    email: emailInput?.value || "",
    dob: dobInput?.value || "",
    gender: genderInput?.value || "",
    nationality: nationalityInput?.value || "",
    address: addressInput?.value || "",
    city: cityInput?.value || "",
    phone: phoneInput?.value || ""
  };
  checkFormChanges();
  updateAvatarInitial();

  // Orders
  try {
    const oref = collection(db, "users", user.uid, "orders");
    const osnap = await getDocs(oref);
    ordersList.innerHTML = "";
    if (osnap.empty) {
      ordersList.innerHTML = `<li class="no-orders">You don't have any orders yet.</li>`;
    } else {
      const items = [];
      osnap.forEach(d => items.push({ id: d.id, ...d.data() }));
      items.sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
      items.forEach(order => {
        const dateStr = order.timestamp
          ? new Date(order.timestamp.seconds*1000).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})
          : "Date not available";
        const li = document.createElement("li");
        li.className = "order-item";
        li.innerHTML = `
          <div class="order-info">
            <span class="order-id">Order #${order.id}</span>
            <span class="order-date">${dateStr}</span>
          </div>
          <div class="order-details">
            <span class="order-items">${order.items || 0} items</span>
            <span class="order-price">₹${(order.total ?? 0).toLocaleString('en-IN')}</span>
            <span class="order-status ${(order.status || 'processing').toLowerCase()}">${order.status || "Processing"}</span>
          </div>`;
        ordersList.appendChild(li);
      });
    }
  } catch (e) {
    console.error("Orders load error:", e);
  }
});

// Change tracking
document.querySelectorAll("#profile-form input, #profile-form select").forEach(el => {
  el.addEventListener("input", () => { checkFormChanges(); updateAvatarInitial(); });
});

// Update Profile
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  try {
    const payload = {
      name: (nameInput?.value || "").trim(),
      email: (emailInput?.value || "").trim(),
      dob: (dobInput?.value || "").trim(),
      gender: (genderInput?.value || "").trim(),
      nationality: (nationalityInput?.value || "").trim(),
      address: (addressInput?.value || "").trim(),
      city: (cityInput?.value || "").trim(),
      phone: (phoneInput?.value || user.phoneNumber || "").trim(),
      lastUpdated: new Date()
    };
    await setDoc(doc(db, "users", user.uid), payload, { merge: true });

    if (headerName) headerName.textContent = payload.name || headerName.textContent || "";
    if (headerSub) headerSub.textContent = payload.email || headerSub.textContent || "";

    originalValues = { ...payload };
    if (saveBtn) saveBtn.disabled = true;

    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Error updating profile:", err);
    alert("Error updating profile. Please try again.");
  }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth).then(() => { window.location.href = "login.html"; })
               .catch(err => console.error("Logout error:", err));
});

// Desktop sidebar tab clicks
personalTab?.addEventListener("click", () => switchTab("personal-info"));
ordersTab?.addEventListener("click", () => switchTab("orders"));

// Mobile tab clicks
mTabPersonal?.addEventListener("click", () => switchTab("personal-info"));
mTabOrders?.addEventListener("click", () => switchTab("orders"));
