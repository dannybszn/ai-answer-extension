import React, { useState, useEffect } from 'react';
import { Camera, Send, X, Loader2 } from 'lucide-react';

function App() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContentScriptReady, setIsContentScriptReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.id && isValidUrl(activeTab.url)) {
        injectContentScript(activeTab.id);
      } else {
        setError('Cannot use the extension on this page.');
      }
    });

    const messageListener = (request: any) => {
      if (request.action === 'screenshotSaved') {
        loadSavedScreenshot();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    loadSavedScreenshot();

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const loadSavedScreenshot = () => {
    chrome.storage.local.get(['capturedImage'], (result) => {
      if (result.capturedImage) {
        setCapturedImage(result.capturedImage);
        setIsSelecting(false);
      }
    });
  };

  const isValidUrl = (url: string | undefined) => {
    return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
  };

  const injectContentScript = (tabId: number) => {
    chrome.runtime.sendMessage({ action: 'injectContentScript' }, (response) => {
      if (response.status === 'ok') {
        checkContentScriptReady(tabId, 5);
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
    setCapturedImage(null);
    setAiResponse(null);
    chrome.storage.local.remove(['capturedImage']);
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

  const handleAskQuestion = async () => {
    if (capturedImage) {
      setIsLoading(true);
      try {
        // Simulating API call to AI service
        const response = await new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve("This image appears to be a screenshot of a webpage. It contains text and possibly some graphical elements. Without more specific details about the content, I can't provide a more detailed analysis. Is there a particular aspect of the image you'd like me to focus on?");
          }, 2000);
        });
        setAiResponse(response);
      } catch (error) {
        setError('Failed to get AI response. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClear = () => {
    setCapturedImage(null);
    setAiResponse(null);
    chrome.storage.local.remove(['capturedImage']);
  };

  return (
    <div className="w-80 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-3 text-center text-indigo-800">Screenshot Analyzer</h1>
      {!capturedImage && (
        <button
          onClick={handleStartSelection}
          disabled={isSelecting || !isContentScriptReady || !!error}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mb-3 transition duration-300 ease-in-out transform hover:scale-105"
        >
          <Camera className="mr-2" size={20} />
          {isSelecting ? 'Selecting...' : 'Select Area'}
        </button>
      )}
      {isSelecting && (
        <p className="text-xs text-indigo-600 text-center animate-pulse mb-2">
          Click and drag on the page to select an area for the screenshot.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 bg-red-100 p-2 rounded-lg mb-2">
          {error}
        </p>
      )}
      {!isContentScriptReady && !error && (
        <p className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded-lg animate-pulse mb-2">
          Initializing... Please wait.
        </p>
      )}
      {capturedImage && (
        <div className="mb-3 bg-white p-3 rounded-lg shadow-md">
          <img src={capturedImage} alt="Captured screenshot" className="w-full mb-3 rounded-lg border border-indigo-200" />
          <div className="flex space-x-2">
            <button
              onClick={handleAskQuestion}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            >
              {isLoading ? (
                <Loader2 className="mr-1 animate-spin" size={16} />
              ) : (
                <Send className="mr-1" size={16} />
              )}
              {isLoading ? 'Analyzing...' : 'Ask'}
            </button>
            <button
              onClick={handleClear}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 text-sm"
            >
              <X className="mr-1 inline" size={16} />
              Clear
            </button>
          </div>
        </div>
      )}
      {aiResponse && (
        <div className="p-3 bg-white rounded-lg shadow-md">
          <h2 className="font-bold mb-1 text-indigo-800 text-sm">AI Response:</h2>
          <p className="text-xs text-gray-700">{aiResponse}</p>
        </div>
      )}
    </div>
  );
}

export default App;