function isValidUrl(url: string | undefined): boolean {
  return !!url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = request.width;
        canvas.height = request.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            request.x,
            request.y,
            request.width,
            request.height,
            0,
            0,
            request.width,
            request.height
          );
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              chrome.downloads.download({
                url: url,
                filename: 'screenshot.png',
                saveAs: true
              });
            }
          });
        }
      };
      img.src = dataUrl;
    });
  }
});

console.log('Screenshot Selector background script loaded');