// components/app/ResponsiveDialog.tsx

import React, { ReactNode, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface ResponsiveDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    onSave: () => Promise<void>;
    onCancel: () => void;
    showDelete?: boolean;
    showArchive?: boolean;
    onDelete?: () => Promise<void>;
    onArchive?: () => Promise<void>;
    isArchived?: boolean;
    onRestore?: () => Promise<void>;
    error?: string | null;
    isLoading?: boolean;
}

export function ResponsiveDialog({
    isOpen,
    onOpenChange,
    title,
    children,
    onSave,
    onCancel,
    showDelete = false,
    showArchive = false,
    onDelete,
    onArchive,
    isArchived = false,
    onRestore,
    error = null,
    isLoading = false
}: ResponsiveDialogProps) {
    const [localError, setLocalError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    if (showDelete && !onDelete) {
        throw new Error('onDelete is required when showDelete is true');
    }

    if (showArchive && (!onArchive || !onRestore)) {
        throw new Error('onArchive and onRestore are required when showArchive is true');
    }

    const handleAction = async (action: () => Promise<void>) => {
        try {
            setLocalLoading(true);
            setLocalError(null);
            await action();
            setLocalLoading(false);
        } catch (err) {
            setLocalError(
                err instanceof Error 
                    ? err.message 
                    : 'An unexpected error occurred'
            );
            setLocalLoading(false);
        }
    };

    const handleSave = () => handleAction(onSave);
    const handleDelete = () => onDelete ? handleAction(onDelete) : undefined;
    const handleArchive = () => onArchive ? handleAction(onArchive) : undefined;
    const handleRestore = () => onRestore ? handleAction(onRestore) : undefined;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col p-0 gap-0 md:p-2 md:gap-2 h-[95vh] md:h-auto md:max-h-[85vh] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="pt-4 md:pl-4">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {(error || localError) && (
                    <Alert variant="destructive" className="mx-6 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {localError || error}
                        </AlertDescription>
                    </Alert>
                )}

                <ScrollArea className="flex-1 px-6 py-4">
                    {children}
                </ScrollArea>

                <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-background">
                    <Button 
                        variant="outline" 
                        onClick={onCancel}
                        disabled={localLoading || isLoading}
                    >
                        Cancel
                    </Button>

                    <div className="flex items-center gap-2">
                        {showDelete && onDelete && (
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete}
                                disabled={localLoading || isLoading}
                            >
                                {(localLoading || isLoading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Delete
                            </Button>
                        )}
                        {showArchive && onArchive && onRestore && (
                            <Button
                                variant="secondary"
                                onClick={isArchived ? handleRestore : handleArchive}
                                disabled={localLoading || isLoading}
                            >
                                {(localLoading || isLoading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {isArchived ? 'Restore' : 'Archive'}
                            </Button>
                        )}
                        <Button 
                            onClick={handleSave}
                            disabled={localLoading || isLoading}
                        >
                            {(localLoading || isLoading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}