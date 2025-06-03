document.addEventListener('DOMContentLoaded', function() {
  const exportButton = document.getElementById('exportButton');

  exportButton.addEventListener('click', () => {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // Execute the main content script in the active tab
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content_script.js']
      });
    });
  });
});
