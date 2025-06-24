import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
  query,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyD3ezc0LYpQ7GMloz0iWhOh83AY1wAJu3I",
  authDomain: "arcfall-voting.firebaseapp.com",
  projectId: "arcfall-voting",
  storageBucket: "arcfall-voting.appspot.com",
  messagingSenderId: "520586455427",
  appId: "1:520586455427:web:f0f32b7375b7e3310e6eb6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const VOTES_COLLECTION = "votes";
const METADATA_DOC_ID = "_metadata";

const DEFAULT_VOTING_OPTIONS = [
  { id: "option1", name: "New Phoenix Armor Set" },
  { id: "option2", name: "Dungeon Map Expansion" },
  { id: "option3", name: "Mount Customization" },
  { id: "option4", name: "Fishing Mini-Game" }
];

const VOTING_TIME_LIMIT_MS = 24 * 60 * 60 * 1000;

// --- Initialize or get voting session metadata ---
export async function initializeAndGetVotingStatus() {
  const metadataRef = doc(db, VOTES_COLLECTION, METADATA_DOC_ID);
  const snap = await getDoc(metadataRef);

  let startTime, endTime;

  if (!snap.exists()) {
    const now = new Date();
    const future = new Date(now.getTime() + VOTING_TIME_LIMIT_MS);
    await setDoc(metadataRef, {
      startTime: serverTimestamp(),
      endTime: Timestamp.fromDate(future)
    });

    // Re-fetch to get server timestamp for startTime
    const freshSnap = await getDoc(metadataRef);
    if (!freshSnap.exists() || !freshSnap.data().startTime) {
      throw new Error("Failed to initialize voting session metadata.");
    }
    startTime = freshSnap.data().startTime.toDate ? freshSnap.data().startTime.toDate() : freshSnap.data().startTime;
    endTime = freshSnap.data().endTime.toDate ? freshSnap.data().endTime.toDate() : freshSnap.data().endTime;

    await initializeVotingOptions();
  } else {
    const data = snap.data();
    startTime = data.startTime.toDate ? data.startTime.toDate() : data.startTime;
    endTime = data.endTime.toDate ? data.endTime.toDate() : data.endTime;
  }

  const nowMs = Date.now();
  const remainingMs = Math.max(0, endTime.getTime() - nowMs);
  const isActive = remainingMs > 0;

  return { isActive, remainingMs, endTime };
}

// Helper to initialize voting options counts to 0
async function initializeVotingOptions() {
  const batch = writeBatch(db);
  for (const option of DEFAULT_VOTING_OPTIONS) {
    const optionRef = doc(db, VOTES_COLLECTION, option.id);
    batch.set(optionRef, { name: option.name, count: 0 }, { merge: true });
  }
  await batch.commit();
}

// Get current votes for all options
export async function getVotingOptionsData() {
  const options = [];
  const q = query(collection(db, VOTES_COLLECTION));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    if (docSnap.id !== METADATA_DOC_ID) {
      const data = docSnap.data();
      options.push({
        id: docSnap.id,
        name: data.name || docSnap.id,
        count: data.count || 0
      });
    }
  });

  // Ensure all default options present, sorted
  return DEFAULT_VOTING_OPTIONS.map(defOpt => {
    const found = options.find(o => o.id === defOpt.id);
    return found || { id: defOpt.id, name: defOpt.name, count: 0 };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

// Cast a vote atomically (returns true if success, false if voting ended)
export async function castVote(optionId) {
  const status = await initializeAndGetVotingStatus();
  if (!status.isActive) return false;

  try {
    const optionRef = doc(db, VOTES_COLLECTION, optionId);
    await updateDoc(optionRef, { count: increment(1) });
    return true;
  } catch (err) {
    console.error("Error casting vote:", err);
    return false;
  }
}

// Reset voting session - deletes metadata and votes (admin/testing only)
export async function resetVotingSession() {
  const batch = writeBatch(db);
  const metaRef = doc(db, VOTES_COLLECTION, METADATA_DOC_ID);
  batch.delete(metaRef);

  const q = query(collection(db, VOTES_COLLECTION));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => batch.delete(docSnap.ref));

  await batch.commit();
}

// --- UI Helpers ---

/**
 * Updates vote bars and percentages live.
 * Expects an array of voting option objects with id and count.
 */
export function updateVoteUI(votingOptions) {
  const totalVotes = votingOptions.reduce((sum, o) => sum + o.count, 0) || 1;
  votingOptions.forEach(({ id, count }) => {
    const pct = Math.round((count / totalVotes) * 100);
    const bar = document.getElementById(`bar-${id}`);
    const percentText = document.getElementById(`percent-${id}`);
    if (bar) bar.style.height = pct + "%";
    if (percentText) percentText.textContent = pct + "%";
  });
}

/**
 * Enables or disables voting buttons based on session active status
 * and whether user already voted (stored in localStorage)
 */
export function setVoteButtonsState(isActive) {
  const buttons = document.querySelectorAll(".vote-box button");
  const voted = localStorage.getItem("votedOption");
  buttons.forEach(btn => {
    btn.disabled = !isActive || Boolean(voted);
  });
}

/**
 * Starts countdown timer UI in a container with given ID.
 * Calls callback when countdown reaches zero.
 */
export function startCountdown(containerId, remainingMs, onEndCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function updateTimer() {
    if (remainingMs <= 0) {
      container.textContent = "Voting has ended!";
      if (onEndCallback) onEndCallback();
      return;
    }
    const seconds = Math.floor((remainingMs / 1000) % 60);
    const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
    const hours = Math.floor((remainingMs / (1000 * 60 * 60)));
    container.textContent = `Voting ends in ${hours}h ${minutes}m ${seconds}s`;
    remainingMs -= 1000;
    setTimeout(updateTimer, 1000);
  }
  updateTimer();
}

/**
 * Starts live listening for vote changes and updates UI accordingly.
 * Returns a function to unsubscribe the listener.
 */
export function listenForVoteChanges(onUpdate) {
  const q = query(collection(db, VOTES_COLLECTION));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const options = [];
    snapshot.forEach(docSnap => {
      if (docSnap.id !== METADATA_DOC_ID) {
        const data = docSnap.data();
        options.push({
          id: docSnap.id,
          name: data.name,
          count: data.count || 0
        });
      }
    });
    onUpdate(options);
  });
  return unsubscribe;
}
