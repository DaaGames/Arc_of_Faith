// voting.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc,
  onSnapshot, updateDoc, increment, collection, getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// (Optional) Import Firebase AI Logic when ready:
// import { getGenerativeModel } from "firebase-ai";

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "arcfall-voting.firebaseapp.com",
  projectId: "arcfall-voting",
  storageBucket: "arcfall-voting.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Voting state and constants
const VOTE_COLLECTION = "votes";
const VOTING_TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours (example)
const voteEndTimeKey = "arcfall_vote_end_time";
const userVotedKey = "arcfall_user_voted";

// Initialize vote end time if not set
if (!localStorage.getItem(voteEndTimeKey)) {
  const endTime = Date.now() + VOTING_TIME_LIMIT_MS;
  localStorage.setItem(voteEndTimeKey, endTime);
}

// Utility: Check if voting is still open
export function isVotingOpen() {
  const endTime = parseInt(localStorage.getItem(voteEndTimeKey), 10);
  return Date.now() < endTime;
}

// Disable all vote buttons
export function disableVoteButtons() {
  document.querySelectorAll(".vote-box button").forEach(btn => {
    btn.disabled = true;
  });
}

// Enable vote buttons (if voting open and user not voted)
export function enableVoteButtons() {
  if (!isVotingOpen() || localStorage.getItem(userVotedKey)) {
    disableVoteButtons();
  } else {
    document.querySelectorAll(".vote-box button").forEach(btn => {
      btn.disabled = false;
    });
  }
}

// Vote function - increments vote count in Firestore
export async function vote(itemId) {
  if (!isVotingOpen()) {
    alert("Voting has ended!");
    disableVoteButtons();
    return;
  }
  if (localStorage.getItem(userVotedKey)) {
    alert("You already voted!");
    disableVoteButtons();
    return;
  }

  const ref = doc(db, VOTE_COLLECTION, itemId);

  try {
    // Atomically increment votes
    await updateDoc(ref, { count: increment(1) });
  } catch (err) {
    // If doc missing, create it with count 1
    if (err.code === "not-found" || err.message.includes("No document to update")) {
      await setDoc(ref, { count: 1 });
    } else {
      alert("Error voting: " + err.message);
      return;
    }
  }

  localStorage.setItem(userVotedKey, itemId);
  disableVoteButtons();
}

// Listen for live updates to votes and update UI bars
export function listenForVotes(itemIds) {
  itemIds.forEach(id => {
    const ref = doc(db, VOTE_COLLECTION, id);
    onSnapshot(ref, snapshot => {
      if (!snapshot.exists()) return;
      updateVotesUI(itemIds);
    });
  });
}

// Update vote bars & percentages UI based on current counts
export async function updateVotesUI(itemIds) {
  let totalVotes = 0;
  const counts = {};

  // Fetch counts for all items
  for (const id of itemIds) {
    const snap = await getDoc(doc(db, VOTE_COLLECTION, id));
    counts[id] = snap.exists() ? snap.data().count || 0 : 0;
    totalVotes += counts[id];
  }

  // Update UI bars and text
  itemIds.forEach(id => {
    const pct = totalVotes === 0 ? 0 : Math.round((counts[id] / totalVotes) * 100);
    const bar = document.getElementById(`bar-${id}`);
    const percentText = document.getElementById(`percent-${id}`);

    if (bar) bar.style.height = pct + "%";
    if (percentText) percentText.innerText = pct + "%";
  });
}

// Countdown timer logic
export function startCountdown(displayElementId) {
  const displayEl = document.getElementById(displayElementId);

  function update() {
    const endTime = parseInt(localStorage.getItem(voteEndTimeKey), 10);
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      displayEl.innerText = "Voting ended";
      disableVoteButtons();
      clearInterval(intervalId);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    displayEl.innerText = `Voting ends in ${hours}h ${mins}m ${secs}s`;
  }

  update();
  const intervalId = setInterval(update, 1000);
  return intervalId;
}

// Helper to export vote function globally (for button onclick)
window.vote = vote;
