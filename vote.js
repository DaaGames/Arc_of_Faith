import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3ezc0LYpQ7GMloz0iWhOh83AY1wAJu3I",
  authDomain: "arcfall-voting.firebaseapp.com",
  projectId: "arcfall-voting",
  storageBucket: "arcfall-voting.firebasestorage.app",
  messagingSenderId: "520586455427",
  appId: "1:520586455427:web:f0f32b7375b7e3310e6eb6",
  measurementId: "G-RL160YZ9PY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const itemIds = ["option1", "option2", "option3"];

window.vote = async function(itemId) {
  if (localStorage.getItem("voted-" + itemId)) {
    alert("You already voted for this item!");
    return;
  }

  const ref = doc(db, "votes", itemId);
  const snap = await getDoc(ref);
  let count = 0;
  if (snap.exists()) count = snap.data().count || 0;
  await setDoc(ref, { count: count + 1 });

  localStorage.setItem("voted-" + itemId, "true");
  updateAllBars();
};

async function updateAllBars() {
  const counts = {};
  let total = 0;

  for (const id of itemIds) {
    const ref = doc(db, "votes", id);
    const snap = await getDoc(ref);
    const count = snap.exists() ? snap.data().count || 0 : 0;
    counts[id] = count;
    total += count;
  }

  for (const id of itemIds) {
    const percent = total === 0 ? 0 : Math.round((counts[id] / total) * 100);
    document.getElementById(`bar-${id}`).style.height = percent + "%";
    document.getElementById(`percent-${id}`).innerText = percent + "%";
  }
}

window.addEventListener("DOMContentLoaded", updateAllBars);
