// components/app/NavInfo.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NavigatorData {
  userAgent: string;
  language: string;
  languages: readonly string[];
  onLine: boolean;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  pdfViewerEnabled: boolean;
  webdriver: boolean;
  platform: string;
  vendor: string;
  appVersion: string;
  methods: string[];
  [key: string]: any;
}

export default function NavigatorInfo() {
  const [open, setOpen] = useState(false);
  const [navigatorInfo, setNavigatorInfo] = useState<Partial<NavigatorData>>({});
  const [error, setError] = useState<string | null>(null);

  const getPropertyValue = (obj: any, prop: string): string => {
    try {
      const value = obj[prop];
      if (value instanceof Function) return 'Function';
      if (value instanceof Object) return JSON.stringify(value);
      return String(value);
    } catch (err) {
      return `Access error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  };

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const info: NavigatorData = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        onLine: navigator.onLine,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        cookieEnabled: navigator.cookieEnabled,
        pdfViewerEnabled: navigator.pdfViewerEnabled,
        webdriver: navigator.webdriver,
        platform: navigator.platform,
        vendor: navigator.vendor,
        appVersion: navigator.appVersion,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(navigator))
          .filter(item => typeof (navigator as any)[item] === 'function'),
        connection: getPropertyValue(navigator, 'connection'),
        mediaCapabilities: getPropertyValue(navigator, 'mediaCapabilities'),
        credentials: getPropertyValue(navigator, 'credentials'),
        permissions: getPropertyValue(navigator, 'permissions'),
        bluetooth: getPropertyValue(navigator, 'bluetooth'),
        usb: getPropertyValue(navigator, 'usb'),
        hid: getPropertyValue(navigator, 'hid'),
        serial: getPropertyValue(navigator, 'serial'),
        storage: getPropertyValue(navigator, 'storage'),
        wakeLock: getPropertyValue(navigator, 'wakeLock'),
        userAgentData: getPropertyValue(navigator, 'userAgentData'),
      };

      setNavigatorInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get navigator information');
    }
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
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
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
    
    return <span className="text-sm">{String(value)}</span>;
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
          
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {Object.entries(navigatorInfo).map(([key, value]) => (
                <div key={key} className="border-b border-border pb-2">
                  <div className="font-medium text-sm text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="mt-1">{renderValue(value)}</div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}