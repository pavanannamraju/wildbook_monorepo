const CONTACT = {
  fullName: "Anurag Jha",
  org: "Wildbook",
  title: "Founder",
  email: "hello@wildbook.in",
  url: "https://www.wildbook.in",
  instagram: "https://www.instagram.com/wildbook.in",
};

function buildVCard() {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${CONTACT.fullName}`,
    `N:Jha;Anurag;;;`,
    `ORG:${CONTACT.org}`,
    `TITLE:${CONTACT.title}`,
    `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
    `URL:${CONTACT.url}`,
    `URL;TYPE=Instagram:${CONTACT.instagram}`,
    "END:VCARD",
  ].join("\r\n");
}

function downloadVCard() {
  const blob = new Blob([buildVCard()], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "anurag-jha-wildbook.vcf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const CARD_URL = "https://wildbook-in.github.io/wildbook_monorepo/";

function renderQr() {
  const canvas = document.getElementById("qr-canvas");
  if (!canvas || typeof QRCode === "undefined") return;

  QRCode.toCanvas(
    canvas,
    CARD_URL,
    {
      width: 200,
      margin: 1,
      color: {
        dark: "#002023",
        light: "#ffffff",
      },
    },
    (error) => {
      if (error) console.error(error);
    }
  );
}

function setupQrToggle() {
  const button = document.getElementById("toggle-qr");
  const panel = document.getElementById("qr-panel");
  if (!button || !panel) return;

  let rendered = false;

  button.addEventListener("click", () => {
    const willShow = panel.hasAttribute("hidden");
    if (willShow) {
      panel.removeAttribute("hidden");
      button.setAttribute("aria-expanded", "true");
      button.textContent = "Hide QR";
      if (!rendered) {
        renderQr();
        rendered = true;
      }
    } else {
      panel.setAttribute("hidden", "");
      button.setAttribute("aria-expanded", "false");
      button.textContent = "Show QR";
    }
  });
}

document.getElementById("save-contact")?.addEventListener("click", downloadVCard);
setupQrToggle();
