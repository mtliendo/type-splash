import type { RaceResult } from "@/lib/types";

function formatTime(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function showEndScreen(
  host: HTMLElement,
  result: RaceResult,
  onAgain: () => void,
) {
  const medal =
    result.beatGhostCount > 0
      ? `<p class="end-medal" role="status">Medal unlocked — he beat ${result.beatGhostCount} ghost${
          result.beatGhostCount === 1 ? "" : "s"
        }!</p>`
      : `<p class="end-note">No ghost medal this time. Race again to chase the shadows.</p>`;

  host.innerHTML = `
    <div class="end-card">
      <p class="end-kicker">Race complete</p>
      <h2>${result.personalBest ? "New personal best!" : "Nice swim!"}</h2>
      ${
        result.personalBest
          ? `<p class="end-confetti">Confetti for Xavier — that was his fastest 25m yet.</p>`
          : ""
      }
      <dl class="end-stats">
        <div><dt>Time</dt><dd>${formatTime(result.totalTimeMs)}</dd></div>
        <div><dt>Accuracy</dt><dd>${Math.round(result.accuracy * 100)}%</dd></div>
        <div><dt>Letters / min</dt><dd>${Math.round(result.lettersPerMinute)}</dd></div>
      </dl>
      ${medal}
      <div class="end-actions">
        <button type="button" class="btn-primary" data-again>Race again</button>
        <a class="btn-secondary" href="/">Home</a>
      </div>
    </div>
  `;
  host.hidden = false;
  host.querySelector("[data-again]")?.addEventListener("click", () => {
    host.hidden = true;
    host.innerHTML = "";
    onAgain();
  });
}
