import React, { useEffect } from 'react';
import { useTourStore } from '@/store/tourStore';
import { useElementPicker } from '@/hooks/useElementPicker';
import { ElementHighlight } from '@/components/ElementHighlight';
import { EditorSidebar } from '@/components/EditorSidebar';
import { TourPlayer } from '@/components/TourPlayer';
import { Tour } from '@/types/tour';

export const App: React.FC = () => {
  const {
    mode,
    hoveredElement,
    currentTour,
    setMode,
    setCurrentTour,
    setCurrentStepIndex,
  } = useTourStore();

  // Initialize element picker
  useElementPicker();

  // Load current tour from storage on mount
  useEffect(() => {
    chrome.storage.local.get('currentTour', (result) => {
      if (result.currentTour) {
        setCurrentTour(result.currentTour);
      }
    });
  }, [setCurrentTour]);

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      console.log('📨 TourLayer received message:', message.type);
      
      if (message.type === 'SET_CURRENT_TOUR') {
        setCurrentTour(message.tour as Tour);
        setMode('editing'); // Show the sidebar immediately
        console.log('✅ Tour set, sidebar should appear');
      } else if (message.type === 'START_TOUR') {
        setCurrentTour(message.tour as Tour);
        setCurrentStepIndex(0);
        setMode('viewing');
        console.log('▶️ Starting tour viewer');
      } else if (message.type === 'CLOSE_EDITOR') {
        setMode('idle');
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [setMode, setCurrentTour, setCurrentStepIndex]);

  const showEditor = currentTour && (mode === 'editing' || mode === 'picking');

  return (
    <>
      {/* Element highlight when picking */}
      {mode === 'picking' && (
        <ElementHighlight element={hoveredElement} label="Click to select" />
      )}

      {/* Editor sidebar */}
      {showEditor && <EditorSidebar onClose={() => setMode('idle')} />}

      {/* Tour player */}
      {mode === 'viewing' && <TourPlayer />}
    </>
  );
};

