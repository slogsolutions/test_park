// src/components/Splash.tsx
import React from "react";
import "./Splash.css";

type SplashProps = {
  message?: string;
  className?: string;
};

export default function Splash({ message, className }: SplashProps) {
  return (
    <div className={`splash-root ${className ?? ""}`} data-testid="app-splash">
      <div className="splash-inner">
        <img src="/Park_your_Vehicle_log.png" alt="App logo" className="splash-image" />
        {message ? <div className="splash-message">{message}</div> : null}
      </div>
    </div>
  );
}
