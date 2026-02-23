//frontend/js/timer.js

let interval = null;
let seconds = 0;

export function startTimer() {
    if (interval) return;

    interval = setInterval(() => {
        seconds++;
        update();
    }, 1000);
}

export function pauseTimer() {
    clearInterval(interval);
    interval = null;
}

export function resetTimer() {
    pauseTimer();
    seconds = 0;
    update();
}

function update() {
    const el = document.getElementById("timer");
    if (!el) return;

    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");

    el.textContent = `${h}:${m}:${s}`;
}