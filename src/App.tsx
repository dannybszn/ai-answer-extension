import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

function App() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContentScriptReady, setIsContentScriptReady] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id && isValidUrl(activeTab.url)) {
        injectContentScript(activeTab.id);
      } else {
        setError('Cannot use the extension on this page.');
      }
    });
  }, []);

  const isValidUrl = (url: string | undefined) => {
    return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
  };

  const injectContentScript = (tabId: number) => {
    chrome.runtime.sendMessage({ action: 'injectContentScript' }, (response) => {
      if (response.status === 'ok') {
        checkContentScriptReady(tabId, 5); // Try 5 times
      } else {
        setError(`Failed to inject content script: ${response.message}`);
      }
    });
  };

  const checkContentScriptReady = (tabId: number, retries: number) => {
    chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        if (retries > 0) {
          setTimeout(() => checkContentScriptReady(tabId, retries - 1), 500);
        } else {
          setError('Content script not ready. Please refresh the page and try again.');
        }
      } else {
        setIsContentScriptReady(true);
      }
    });
  };

  const handleStartSelection = () => {
    if (!isContentScriptReady) {
      setError('Content script not ready. Please wait or refresh the page and try again.');
      return;
    }

    setIsSelecting(true);
    setError(null);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id && isValidUrl(activeTab.url)) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'startSelection' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            setError('Failed to start selection. Please refresh the page and try again.');
            setIsSelecting(false);
          }
        });
      } else {
        setError('Cannot use the extension on this page.');
        setIsSelecting(false);
      }
    });
  };

  return (
    <div className="w-64 p-4 bg-white">
      <h1 className="text-xl font-bold mb-4">Screenshot Selector</h1>
      <button
        onClick={handleStartSelection}
        disabled={isSelecting || !isContentScriptReady || !!error}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mb-2"
      >
        <Camera className="mr-2" size={20} />
        {isSelecting ? 'Selecting...' : 'Select Area'}
      </button>
      {isSelecting && (
        <p className="mt-2 text-sm text-gray-600">
          Click and drag on the page to select an area for the screenshot.
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {!isContentScriptReady && !error && (
        <p className="mt-2 text-sm text-yellow-600">
          Initializing... Please wait.
        </p>
      )}
    </div>
  );
}

export default App;