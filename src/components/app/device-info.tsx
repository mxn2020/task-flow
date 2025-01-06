import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

export default function DeviceInfo() {
  const [open, setOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});

  useEffect(() => {
    const info = {
      // User Agent
      userAgent: navigator.userAgent,
      
      // Screen properties
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenAvailWidth: window.screen.availWidth,
      screenAvailHeight: window.screen.availHeight,
      screenColorDepth: window.screen.colorDepth,
      screenPixelRatio: window.devicePixelRatio,
      
      // Window properties
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      
      // Device properties
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      
      // Device detection
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
      isAndroid: /Android/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      
      // Touch capabilities
      maxTouchPoints: navigator.maxTouchPoints,
      
      // PWA install state
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      
      // Orientation
      orientation: screen.orientation ? screen.orientation.type : null
    };
    
    setDeviceInfo(info);
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <Smartphone className="mr-2 h-4 w-4" />
        Device Info
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Device Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.entries(deviceInfo).map(([key, value]) => (
              <div key={key} className="border-b border-border pb-2">
                <div className="font-medium text-sm text-muted-foreground">{key}</div>
                <div className="mt-1">
                  {typeof value === 'object' && value !== null ? (
                    <pre className="text-sm bg-secondary/30 p-2 rounded">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-sm">{String(value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}