document.getElementById("add-course").addEventListener("click", () => {
  const container = document.getElementById("courses-container");

  const div = document.createElement("div");
  div.className = "course-input";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter course code";

  div.appendChild(input);
  container.appendChild(div);
});

document.getElementById("run").addEventListener("click", async () => {
  const inputs = document.querySelectorAll(".course-input input");
  const sections = Array.from(inputs)
    .map(input => input.value.trim())
    .filter(s => s.length > 0);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    alert("No active tab found.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: selectSections,
    args: [sections],
  });
});

async function selectSections(desiredSections) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < desiredSections.length; i++) {
    const section = desiredSections[i];
    const containers = document.querySelectorAll("div.ums-grid-offered-section");

    let found = false;

    containers.forEach(container => {
      if (container.textContent.includes(section)) {
        const checkbox = container.querySelector("input[type='checkbox']");
        if (checkbox && !checkbox.checked) {
          checkbox.click();
          console.log(`✅ [${i + 1}/${desiredSections.length}] Selected: ${section}`);
          found = true;
        }
      }
    });

    if (!found) {
      console.log(`⚠️ [${i + 1}/${desiredSections.length}] Section not found: ${section}`);
    }

    await delay(1000); // safer delay
  }

  console.log("🎉 All selections attempted.");
}
