import React, { useEffect, useState } from 'react';
import { useTourStore } from '@/store/tourStore';
import { waitForElement } from '@/utils/selector';
import { Beacon } from './Beacon';
import { TooltipCard } from './TooltipCard';

export const TourPlayer: React.FC = () => {
  const {
    mode,
    currentTour,
    currentStepIndex,
    setIsPlaying,
    setMode,
    nextStep,
    prevStep,
    setCurrentStepIndex,
  } = useTourStore();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const currentStep = currentTour?.steps[currentStepIndex];

  // Find target element when step changes
  useEffect(() => {
    if (!currentStep || mode !== 'viewing') {
      setTargetElement(null);
      setShowTooltip(false);
      return;
    }

    const findElement = async () => {
      const element = await waitForElement(currentStep.selector);
      if (element) {
        setTargetElement(element);
        setShowTooltip(false); // Start with beacon
      } else {
        console.warn(`Element not found: ${currentStep.selector}`);
        setTargetElement(null);
      }
    };

    findElement();
  }, [currentStep, mode]);

  const handleBeaconClick = () => {
    setShowTooltip(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setMode('idle');
    setCurrentStepIndex(0);
    setShowTooltip(false);
  };

  const handleNext = () => {
    setShowTooltip(false);
    nextStep();
  };

  const handlePrev = () => {
    setShowTooltip(false);
    prevStep();
  };

  if (mode !== 'viewing' || !currentStep || !targetElement) {
    return null;
  }

  const rect = targetElement.getBoundingClientRect();
  const beaconX = rect.left + rect.width / 2 - 10 + window.scrollX;
  const beaconY = rect.top + rect.height / 2 - 10 + window.scrollY;

  return (
    <>
      {/* Beacon */}
      {!showTooltip && currentStep.pulseEnabled && (
        <Beacon x={beaconX} y={beaconY} onClick={handleBeaconClick} />
      )}

      {/* Tooltip */}
      {showTooltip && (
        <TooltipCard
          step={currentStep}
          targetElement={targetElement}
          currentStep={currentStepIndex}
          totalSteps={currentTour?.steps.length || 0}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={handleClose}
        />
      )}
    </>
  );
};

