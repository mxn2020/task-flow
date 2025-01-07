// components/app/DeviceInfo.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, AlertCircle } from 'lucide-react';

interface DeviceInformation {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  screenAvailWidth: number;
  screenAvailHeight: number;
  screenColorDepth: number;
  screenPixelRatio: number;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  maxTouchPoints: number;
  isStandalone: boolean;
  orientation: string | null;
}

export default function DeviceInfo() {
  const [open, setOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<Partial<DeviceInformation>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const info: DeviceInformation = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenAvailWidth: window.screen.availWidth,
        screenAvailHeight: window.screen.availHeight,
        screenColorDepth: window.screen.colorDepth,
        screenPixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isAndroid: /Android/i.test(navigator.userAgent),
        isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
        maxTouchPoints: navigator.maxTouchPoints,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        orientation: screen.orientation ? screen.orientation.type : null
      };
      
      setDeviceInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get device information');
    }
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
          
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {Object.entries(deviceInfo).map(([key, value]) => (
                <div key={key} className="border-b border-border pb-2">
                  <div className="font-medium text-sm text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}