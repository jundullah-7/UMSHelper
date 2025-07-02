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
