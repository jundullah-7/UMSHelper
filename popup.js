document.getElementById("run").addEventListener("click", async () => {
  // Get input text, split by commas, trim spaces
  const input = document.getElementById("sections").value;
  const sections = input.split(",").map(s => s.trim()).filter(s => s.length > 0);

  // Get the current active tab (your UMS advising page)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    alert("No active tab found.");
    return;
  }

  // Execute the selection script in the active tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: selectSections,
    args: [sections],
  });
});

// This function runs inside the UMS page context
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

    await delay(500); // wait 500ms before selecting the next section
  }

  console.log("🎉 All selections attempted.");
}
