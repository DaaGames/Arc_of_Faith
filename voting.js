// voting.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc,
  onSnapshot, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Your actual Firebase config
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

const VOTE_COLLECTION = "votes";
const VOTING_TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours voting window
const voteEndTimeKey = "arcfall_vote_end_time";
const userVotedKey = "arcfall_user_voted";

// Initialize vote end time in localStorage if not present
if (!localStorage.getItem(voteEndTimeKey)) {
  const endTime = Date.now() + VOTING_TIME_LIMIT_MS;
  localStorage.setItem(voteEndTimeKey, endTime);
}

// Check if voting is still open
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

// Enable vote buttons only if voting is open and user hasn't voted
export function enableVoteButtons() {
  if (!isVotingOpen() || localStorage.getItem(userVotedKey)) {
    disableVoteButtons();
  } else {
    document.querySelectorAll(".vote-box button").forEach(btn => {
      btn.disabled = false;
    });
  }
}

// Vote for an itemId
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
    await updateDoc(ref, { count: increment(1) });
  } catch (err) {
    // If document doesn't exist yet, create it
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

// Listen for vote updates and update UI live
export function listenForVotes(itemIds) {
  itemIds.forEach(id => {
    const ref = doc(db, VOTE_COLLECTION, id);
    onSnapshot(ref, snapshot => {
      if (!snapshot.exists()) return;
      updateVotesUI(itemIds);
    });
  });
}

// Fetch votes and update UI bars and percentages
export async function updateVotesUI(itemIds) {
  let totalVotes = 0;
  const counts = {};

  for (const id of itemIds) {
    const snap = await getDoc(doc(db, VOTE_COLLECTION, id));
    counts[id] = snap.exists() ? snap.data().count || 0 : 0;
    totalVotes += counts[id];
  }

  itemIds.forEach(id => {
    const pct = totalVotes === 0 ? 0 : Math.round((counts[id] / totalVotes) * 100);
    const bar = document.getElementById(`bar-${id}`);
    const percentText = document.getElementById(`percent-${id}`);

    if (bar) bar.style.height = pct + "%";
    if (percentText) percentText.innerText = pct + "%";
  });
}

// Countdown timer display
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

// Expose vote globally for button onclick in index.html
window.vote = vote;
