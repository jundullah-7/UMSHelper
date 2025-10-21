// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("courses-container");
  const addBtn = document.getElementById("add-course");
  const runBtn = document.getElementById("run");

  // Ensure at least one input exists and attach handlers
  let firstInput = container.querySelector(".course-input input");
  if (!firstInput) firstInput = addCourseInput("", true);
  attachInputHandlers(firstInput);

  // Add-course button
  addBtn.addEventListener("click", () => {
    const newInput = addCourseInput("", true);
    attachInputHandlers(newInput);
  });

  // Run button
  runBtn.addEventListener("click", runHandler);
});

/**
 * Creates a new .course-input block with an input inside.
 * Returns the input element.
 */
function addCourseInput(value = "", focus = false) {
  const container = document.getElementById("courses-container");

  const div = document.createElement("div");
  div.className = "course-input";
  div.style.display = "flex";
  div.style.marginBottom = "12px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter course code";
  input.value = value.trim();
  input.style.flex = "1";
  input.style.padding = "10px 14px";
  input.style.borderRadius = "6px";
  input.style.border = "1px solid #e0e0e0";
  input.autocomplete = "off";

  div.appendChild(input);
  container.appendChild(div);

  if (focus) {
    // small timeout to allow DOM to insert before focusing
    setTimeout(() => input.focus(), 50);
  }

  return input;
}

/**
 * Attaches the necessary handlers to the input so that:
 * - typing a comma splits the value into multiple inputs
 * - pasting multiple comma-separated codes auto-creates inputs
 * - pressing Enter adds a new input
 */
function attachInputHandlers(inputEl) {
  if (!inputEl) return;

  // input event: watch for comma typed
  inputEl.addEventListener("input", (e) => {
    handleCommaSplit(e.target);
  });

  // paste event: intercept and split pasted text
  inputEl.addEventListener("paste", (e) => {
    handlePasteSplit(e, inputEl);
  });

  // keyboard convenience: Enter -> add new input; Backspace on empty -> remove
  inputEl.addEventListener("keydown", (e) => {
    const allInputs = Array.from(document.querySelectorAll(".course-input input"));
    if (e.key === "Enter") {
      e.preventDefault();
      const newInput = addCourseInput("", true);
      attachInputHandlers(newInput);
    } else if (e.key === "Backspace" && inputEl.value === "") {
      // remove input if more than one
      if (allInputs.length > 1) {
        const parent = inputEl.parentElement;
        const idx = allInputs.indexOf(inputEl);
        parent.remove();
        // focus previous if exists
        const newAll = Array.from(document.querySelectorAll(".course-input input"));
        const prev = newAll[Math.max(0, idx - 1)];
        if (prev) prev.focus();
      }
    }
  });
}

/**
 * If the input's value contains commas, split and create new inputs.
 * Puts first token into current input and creates subsequent inputs for extras.
 */
function handleCommaSplit(inputEl) {
  const val = inputEl.value;
  if (!val.includes(",")) return;

  const parts = val.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    inputEl.value = "";
    return;
  }

  // keep the first part in this input
  inputEl.value = parts.shift();

  // insert remaining parts immediately after this input's block, preserving order
  let insertAfter = inputEl.parentElement;
  for (const part of parts) {
    const newInput = addCourseInput(part, false);
    attachInputHandlers(newInput);
    // move newly created block right after current block
    insertAfter.parentNode.insertBefore(newInput.parentElement, insertAfter.nextSibling);
    insertAfter = newInput.parentElement;
  }

  // focus last created input
  const allInputs = Array.from(document.querySelectorAll(".course-input input"));
  allInputs[allInputs.length - 1].focus();
}

/**
 * Handle explicit paste events (intercept clipboard and split)
 */
function handlePasteSplit(e, inputEl) {
  const clipboard = (e.clipboardData || window.clipboardData);
  if (!clipboard) return;
  const text = clipboard.getData("text");
  if (!text) return;

  if (text.includes(",")) {
    e.preventDefault();

    const parts = text.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    // put first part into current input
    inputEl.value = parts.shift();

    // insert the rest right after current block
    let insertAfter = inputEl.parentElement;
    for (const part of parts) {
      const newInput = addCourseInput(part, false);
      attachInputHandlers(newInput);
      insertAfter.parentNode.insertBefore(newInput.parentElement, insertAfter.nextSibling);
      insertAfter = newInput.parentElement;
    }

    // focus last created input
    const allInputs = Array.from(document.querySelectorAll(".course-input input"));
    allInputs[allInputs.length - 1].focus();
  }
  // otherwise let normal paste happen
}

/**
 * Run handler - collect all codes and execute selection in the active tab
 */
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
    alert("Please open your UMS advising page first.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: selectSections,
    args: [sections],
  });
}

/**
 * This function runs inside the UMS page context.
 * It was kept identical to your previous logic but with 1s delay for safety.
 */
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
    await delay(1000);
  }
  console.log("🎉 All selections attempted.");
}
