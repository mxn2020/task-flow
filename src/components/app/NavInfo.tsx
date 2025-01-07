import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

export default function NavigatorInfo() {
  const [open, setOpen] = useState(false);
  const [navigatorInfo, setNavigatorInfo] = useState({});

  useEffect(() => {
    const getPropertyValue = (obj: any, prop: string) => {
      try {
        const value = obj[prop];
        if (value instanceof Function) return 'Function';
        if (value instanceof Object) return JSON.stringify(value);
        return String(value);
      } catch (e) {
        return `Error accessing: ${(e as any).message}`;
      }
    };

    const info = {
      // Standard Properties
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      pdfViewerEnabled: navigator.pdfViewerEnabled,
      webdriver: navigator.webdriver,
      
      // Connection Info
      connection: getPropertyValue(navigator, 'connection'),
      
      // Media Capabilities
      mediaCapabilities: getPropertyValue(navigator, 'mediaCapabilities'),
      
      // Security-related
      credentials: getPropertyValue(navigator, 'credentials'),
      permissions: getPropertyValue(navigator, 'permissions'),
      
      // Device APIs
      bluetooth: getPropertyValue(navigator, 'bluetooth'),
      usb: getPropertyValue(navigator, 'usb'),
      hid: getPropertyValue(navigator, 'hid'),
      serial: getPropertyValue(navigator, 'serial'),
      
      // Storage & Wake Lock
      storage: getPropertyValue(navigator, 'storage'),
      wakeLock: getPropertyValue(navigator, 'wakeLock'),
      
      // User Agent Data
      userAgentData: getPropertyValue(navigator, 'userAgentData'),
      
      // Deprecated but often available
      platform: navigator.platform,
      vendor: navigator.vendor,
      appVersion: navigator.appVersion,
      
      // Methods Available
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(navigator))
        .filter(item => typeof (navigator as any)[item] === 'function')
    };

    setNavigatorInfo(info);
  }, []);

  const renderValue = (value: any) => {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((item, index) => (
            <li key={index} className="text-sm">{String(item)}</li>
          ))}
        </ul>
      );
    }
    
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <pre className="text-sm bg-secondary/30 p-2 rounded overflow-x-auto">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      }
    } catch {
      // Not JSON, render as string
    }
    
    return <span className="text-sm">{value}</span>;
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <Info className="mr-2 h-4 w-4" />
        Navigator Info
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Navigator Information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.entries(navigatorInfo).map(([key, value]) => (
              <div key={key} className="border-b border-border pb-2">
                <div className="font-medium text-sm text-muted-foreground">{key}</div>
                <div className="mt-1">
                  {renderValue(value)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}