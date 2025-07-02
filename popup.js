document.getElementById("run").addEventListener("click", async () => {
  const input = document.getElementById("sections").value;
  const sections = input.split(",").map(s => s.trim());

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: selectSections,
    args: [sections],
  });
});

function selectSections(desiredSections) {
  desiredSections.forEach(section => {
    const containers = document.querySelectorAll("div.ums-grid-offered-section");

    containers.forEach(container => {
      if (container.textContent.includes(section)) {
        const checkbox = container.querySelector("input[type='checkbox']");
        if (checkbox && !checkbox.checked) {
          checkbox.click();
          console.log(`✅ Selected section: ${section}`);
        } else {
          console.log(`⚠️ Checkbox not found or already selected for: ${section}`);
        }
      }
    });
  });
}
