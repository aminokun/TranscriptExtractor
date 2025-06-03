/**
 * Main function to run the export process.
 * This version uses the specific scroll container ID found by the user.
 * FINAL VERSION
 */
async function runExport() {
  console.log("--- Teams Transcript Exporter v6 (Final) ---");

  // --- Step 1: Find the specific scrollable container using its unique ID ---
  const scrollContainer = document.querySelector('#scrollToTargetTargetedFocusZone');

  // If the container isn't found, stop the script immediately.
  if (!scrollContainer) {
    alert("CRITICAL ERROR: Could not find the specific scroll container with ID '#scrollToTargetTargetedFocusZone'. The page structure may have changed.");
    return;
  }
  
  console.log("SUCCESS: Found the correct scroll container:", scrollContainer);
  alert("The extension will now scrape the transcript as it scrolls. Please wait, this may take a minute for long transcripts.");

  // --- Step 2: Scrape-as-you-scroll loop ---
  const transcriptMap = new Map();
  let stallCount = 0; // Counter to detect when we've reached the end
  const maxStall = 10;
  while (stallCount < maxStall) { // Stop after 3 consecutive scrolls with no new items
    const itemsBeforeScroll = transcriptMap.size;

    // Scrape all currently visible items
    const visibleEntries = document.querySelectorAll('div[data-list-index]');
    visibleEntries.forEach(entry => {
      const index = entry.getAttribute('data-list-index');
      if (!transcriptMap.has(index)) {
        const speakerSpan = entry.querySelector('span[id^="timestampSpeakerAriaLabel-"]');
        const contentDiv = entry.querySelector('div[id^="sub-entry-"]');
        if (speakerSpan && contentDiv) {
          transcriptMap.set(index, {
            speaker: speakerSpan.innerText.trim(),
            content: contentDiv.innerText.trim()
          });
        }
      }
    });

    const itemsAfterScrape = transcriptMap.size;
    
    // Check if we're at the end
    if (itemsAfterScrape === itemsBeforeScroll) {
      stallCount++;
      console.log(`No new items found. Stall count: ${stallCount}/${maxStall}. Total items: ${itemsAfterScrape}`);
    } else {
      stallCount = 0; // Reset stall count if we found new items
      console.log(`Captured ${itemsAfterScrape - itemsBeforeScroll} new item(s). Total unique items: ${itemsAfterScrape}`);
    }

    // Scroll down by 80% of the container's visible height
    scrollContainer.scrollBy(0, scrollContainer.clientHeight * 0.8);

    // Wait for the new items to render
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("Finished scrolling and scraping.");

  // --- Step 3: Format and Download ---
  if (transcriptMap.size === 0) {
    alert("Could not find any transcript entries.");
    return;
  }
  
  // Sort entries by index to ensure correct order
  const sortedEntries = Array.from(transcriptMap.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));
  
  let transcriptText = "";
  for (const [index, data] of sortedEntries) {
    transcriptText += `Name & Time: ${data.speaker}\nContent: ${data.content}\n\n`;
  }
  
  downloadAsFile(transcriptText, `teams_transcript_${sortedEntries.length}_entries.txt`);
}

function downloadAsFile(textContent, fileName) {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert(`Export complete! ${transcriptMap.size} unique entries saved to ${fileName}.`);
}

// Global map variable to be accessible by the download function for the final alert
let transcriptMap; 
runExport();
