chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'injectContentScript') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab.id && isValidUrl(activeTab.url)) {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['contentScript.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
            } else {
              sendResponse({ status: 'ok' });
            }
          });
        } else {
          sendResponse({ status: 'error', message: 'Invalid tab or URL' });
        }
      });
      return true; // Indicates that the response is sent asynchronously
    } else if (request.action === 'captureScreenshot') {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (sender.tab && sender.tab.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'processScreenshot',
            dataUrl: dataUrl,
            area: request.area
          });
        }
      });
      return true;
    } else if (request.action === 'screenshotCaptured') {
      chrome.runtime.sendMessage(request);
      return true;
    }
  });
  
  function isValidUrl(url: string | undefined): boolean {
    return !!url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
  }
  
  console.log('Screenshot Selector background script loaded');