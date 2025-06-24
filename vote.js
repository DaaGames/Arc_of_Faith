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

// Expose globally for HTML onclick
window.vote = async function(itemId) {
  // Prevent multiple votes using localStorage
  if (localStorage.getItem("voted-" + itemId)) {
    alert("You already voted for this item!");
    return;
  }

  const itemRef = doc(db, "votes", itemId);
  const docSnap = await getDoc(itemRef);

  let count = 0;
  if (docSnap.exists()) {
    count = docSnap.data().count || 0;
  }

  await setDoc(itemRef, { count: count + 1 });
  document.getElementById(`votes-${itemId}`).innerText = `${count + 1} votes`;
  localStorage.setItem("voted-" + itemId, "true");
};

window.addEventListener("DOMContentLoaded", async () => {
  const items = document.querySelectorAll(".item");
  for (const item of items) {
    const id = item.getAttribute("data-id");
    const itemRef = doc(db, "votes", id);
    const docSnap = await getDoc(itemRef);
    if (docSnap.exists()) {
      const count = docSnap.data().count || 0;
      document.getElementById(`votes-${id}`).innerText = `${count} votes`;
    }
  }
});
