if (!window.screenshotSelectorInitialized) {
    window.screenshotSelectorInitialized = true;
  
    let startX: number, startY: number, endX: number, endY: number;
    let selectionBox: HTMLDivElement | null = null;
    let isSelecting = false;
  
    function createSelectionBox() {
      selectionBox = document.createElement('div');
      selectionBox.style.position = 'fixed';
      selectionBox.style.border = '2px solid #007bff';
      selectionBox.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
      selectionBox.style.pointerEvents = 'none';
      selectionBox.style.zIndex = '9999999';
      document.body.appendChild(selectionBox);
    }
  
    function updateSelectionBox() {
      if (selectionBox) {
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
  
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
      }
    }
  
    function handleMouseDown(e: MouseEvent) {
      if (isSelecting) {
        startX = e.clientX;
        startY = e.clientY;
        createSelectionBox();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }
  
    function handleMouseMove(e: MouseEvent) {
      if (isSelecting && selectionBox) {
        endX = e.clientX;
        endY = e.clientY;
        updateSelectionBox();
      }
    }
  
    function handleMouseUp() {
      if (isSelecting) {
        isSelecting = false;
        document.body.style.userSelect = 'auto';
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
  
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
  
        chrome.runtime.sendMessage({
          action: 'captureScreenshot',
          area: { x, y, width, height }
        });
  
        if (selectionBox) {
          selectionBox.remove();
          selectionBox = null;
        }
      }
    }
  
    function processScreenshot(dataUrl: string, area: { x: number, y: number, width: number, height: number }) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = area.width;
        canvas.height = area.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'screenshot.png';
              a.click();
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
      };
      img.src = dataUrl;
    }
  
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'startSelection') {
        isSelecting = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'crosshair';
        document.addEventListener('mousedown', handleMouseDown);
        sendResponse({ status: 'ok' });
      } else if (request.action === 'ping') {
        sendResponse({ status: 'ok' });
      } else if (request.action === 'processScreenshot') {
        processScreenshot(request.dataUrl, request.area);
      }
      return true; // Indicates that the response is sent asynchronously
    });
  
    console.log('Screenshot Selector content script loaded');
  }