import React from 'react';
import CosmicCanvas from '../components/CosmicCanvas';
import LiquidCard from '../components/ui/LiquidCard';

export default function ComingSoon({ title = "COMING SOON" }) {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center font-inter text-on-background px-margin">
      <div className="relative z-10 w-full max-w-[600px] text-center">
        <LiquidCard
          title={title}
          category="// CALIBRATING"
          price="---"
        >
          <div className="p-unit-4 flex flex-col items-center">
            <h1 className="font-mono text-[24px] text-primary-container mb-4">
              [ SYSTEM UPGRADE IN PROGRESS ]
            </h1>
            <p className="font-inter text-[16px] text-text-muted mb-6 max-w-[400px]">
              New hardware configurations are being calibrated. Check back soon for exclusive {title.toLowerCase()} drops.
            </p>
          </div>
        </LiquidCard>
      </div>
    </div>
  );
}
