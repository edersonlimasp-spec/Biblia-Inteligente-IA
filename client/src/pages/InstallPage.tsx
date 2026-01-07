import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { InstallModal } from "@/components/InstallModal";

interface InstallPageProps {
  onBack: () => void;
}

export function InstallPage({ onBack }: InstallPageProps) {
  const [showModal, setShowModal] = useState(true);
  const [, setLocation] = useLocation();

  const handleModalChange = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      setLocation("/");
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <InstallModal 
        open={showModal} 
        onOpenChange={handleModalChange}
        autoPrompt={true}
      />
    </div>
  );
}
