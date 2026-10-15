import { isSignedIn, isAuthStub, loginToPlay } from "./auth";

function labelFor(button: HTMLButtonElement, signedIn: boolean) {
  const large = button.dataset.size === "lg";
  if (signedIn || isAuthStub()) {
    return large ? "Jump in the pool" : "Start racing";
  }
  return "Parent sign in";
}

async function boot() {
  const signedIn = await isSignedIn();
  document.querySelectorAll<HTMLButtonElement>(".js-auth-cta").forEach((button) => {
    button.textContent = labelFor(button, signedIn);
    button.addEventListener("click", () => {
      if (signedIn || isAuthStub()) {
        window.location.assign("/play");
        return;
      }
      void loginToPlay();
    });
  });
}

void boot();
