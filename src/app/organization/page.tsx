// app/organization/page.tsx

'use client';

import DesktopOrganizationPage from "@/components/task/organization/DesktopOrganizationPage";
import MobileOrganizationPage from "@/components/task/organization/MobileOrganizationPage";
import { useEffect, useState } from "react";

export default function OrganizationPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return <MobileOrganizationPage />;
  }

  return <DesktopOrganizationPage />; // Your existing component
}