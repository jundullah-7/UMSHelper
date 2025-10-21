// popup.js - improved auto-split-on-comma + paste behavior
// Assumes your popup.html has:
// - a container with id="courses-container"
// - a button with id="add-course"
// - a button with id="run"

document.addEventListener("DOMContentLoaded", () => {
  // Ensure at least one input exists
  if (!document.querySelector(".course-input")) addCourseInput();

  // Add-course button
  document.getElementById("add-course").addEventListener("click", () => {
    addCourseInput("", true);
  });

  // Run script button
  document.getElementById("run").addEventListener("click", runHandler);
});

// Creates a course input block and returns the input element
function addCourseInput(value = "", focus = false) {
  const container = document.getElementById("courses-container");

  const div = document.createElement("div");
  div.className = "course-input";
  div.style.display = "flex";
  div.style.marginBottom = "10px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter course code";
  input.value = value.trim();
  input.style.flex = "1";
  input.style.padding = "8px 10px";
  input.style.borderRadius = "6px";
  input.style.border = "1px solid #e0e0e0";

  // Handle typing commas
  input.addEventListener("input", (e) => {
    handleCommaSplit(e.target);
  });

  // Handle paste (explicit) - we intercept paste so we can split all pasted codes
  input.addEventListener("paste", (e) => {
    handlePasteSplit(e, input);
  });

  // Optional: support pressing Enter to add a new input
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCourseInput("", true);
    }
    // Support Backspace to remove empty input (if there's more than 1)
    if (e.key === "Backspace" && input.value === "") {
      const all = Array.from(document.querySelectorAll(".course-input input"));
      if (all.length > 1) {
        // remove this block
        const parent = input.parentElement;
        parent.remove();
        // focus previous input if exists
        const idx = all.indexOf(input);
        const prev = all[Math.max(0, idx - 1)];
        if (prev) prev.focus();
      }
    }
  });

  div.appendChild(input);
  container.appendChild(div);

  if (focus) {
    setTimeout(() => input.focus(), 50);
  }
  return input;
}

// If user types a comma inside an input, split and create new inputs for extras
function handleCommaSplit(inputEl) {
  const val = inputEl.value;
  if (!val.includes(",")) return;

  const parts = val.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    inputEl.value = "";
    return;
  }

  // put first part in this input
  inputEl.value = parts.shift();

  // insert remaining parts as new inputs right after this input's block
  const thisBlock = inputEl.parentElement;
  let insertAfter = thisBlock;
  parts.forEach(p => {
    const newInput = addCourseInput(p, false);
    // move newly appended block right after current block for nicer order
    insertAfter.parentNode.insertBefore(newInput.parentElement, insertAfter.nextSibling);
    insertAfter = newInput.parentElement;
  });

  // focus on the last created input
  const allInputs = Array.from(document.querySelectorAll(".course-input input"));
  allInputs[allInputs.length - 1].focus();
}

// Handle paste event explicitly: split by commas and create inputs
function handlePasteSplit(e, inputEl) {
  // Try to get clipboard text
  const clipboard = (e.clipboardData || window.clipboardData);
  if (!clipboard) return;

  const text = clipboard.getData("text");
  if (!text) return;

  // If text contains a comma, intercept default paste and split
  if (text.includes(",")) {
    e.preventDefault();
    const parts = text.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    // Put first part into current input
    inputEl.value = parts.shift();

    // Insert remaining parts as new inputs right after current input block
    const thisBlock = inputEl.parentElement;
    let insertAfter = thisBlock;
    parts.forEach(p => {
      const newInput = addCourseInput(p, false);
      // move new input block to right position
      insertAfter.parentNode.insertBefore(newInput.parentElement, insertAfter.nextSibling);
      insertAfter = newInput.parentElement;
    });

    // focus last created input
    const allInputs = Array.from(document.querySelectorAll(".course-input input"));
    allInputs[allInputs.length - 1].focus();
  } else {
    // default paste behavior if no comma
    // allow browser to paste normally (do nothing)
  }
}

// Run handler: collects codes and executes selection script in the active tab
async function runHandler() {
  const inputs = document.querySelectorAll(".course-input input");
  const sections = Array.from(inputs)
    .map(i => i.value.trim())
    .filter(s => s);

  if (sections.length === 0) {
    alert("Please add at least one course code.");
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    alert("Open the UMS advising page first.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: selectSections,
    args: [sections],
  });
}

// This runs inside the UMS page
async function selectSections(desiredSections) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
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
    await delay(1000); // safe 1s delay
  }
  console.log("🎉 All selections attempted.");
}
 