document.getElementById("add-course").addEventListener("click", () => {
  addCourseInput();
});

function addCourseInput(value = "") {
  const container = document.getElementById("courses-container");
  const div = document.createElement("div");
  div.className = "course-input";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter course code";
  input.value = value.trim();

  // Add event listener for auto-splitting commas
  input.addEventListener("input", e => {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",").map(v => v.trim()).filter(Boolean);
      e.target.value = parts.shift(); // keep first one in current box
      for (const part of parts) {
        addCourseInput(part); // create new boxes for the rest
      }
    }
  });

  div.appendChild(input);
  container.appendChild(div);
}

document.getElementById("run").addEventListener("click", async () => {
  const inputs = document.querySelectorAll(".course-input input");
  const sections = Array.from(inputs)
    .map(i => i.value.trim())
    .filter(s => s);

  if (sections.length === 0) return alert("Please enter at least one course code.");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return alert("Please open your UMS advising page.");

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: selectSections,
    args: [sections],
  });
});

async function selectSections(desiredSections) {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < desiredSections.length; i++) {
    const section = desiredSections[i];
    const containers = document.querySelectorAll("div.ums-grid-offered-section");
    let found = false;
    containers.forEach(c => {
      if (c.textContent.includes(section)) {
        const cb = c.querySelector("input[type='checkbox']");
        if (cb && !cb.checked) {
          cb.click();
          console.log(`✅ [${i+1}/${desiredSections.length}] Selected: ${section}`);
          found = true;
        }
      }
    });
    if (!found) console.log(`⚠️ [${i+1}/${desiredSections.length}] Not found: ${section}`);
    await delay(1000); // 1 second delay between selections
  }
  console.log("🎉 All selections attempted.");
}
