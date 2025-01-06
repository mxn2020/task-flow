import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponsiveDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    onSave: () => void;
    onCancel: () => void;
    showDelete?: boolean;
    showArchive?: boolean;
    onDelete?: () => void;
    onArchive?: () => void;
    isArchived?: boolean;
    onRestore?: () => void;
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
    onRestore
}: ResponsiveDialogProps) {
    if (showDelete && !onDelete) {
        throw new Error('onDelete is required when showDelete is true');
    }

    if (showArchive && (!onArchive || !onRestore)) {
        throw new Error('onArchive and onRestore are required when showArchive is true');
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col p-0 gap-0 md:p-2 md:gap-2 h-[95vh] md:h-auto md:max-h-[85vh] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="pt-4 md:pl-4">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                    {children}
                </ScrollArea>

                <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-background">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>

                    <div className="flex items-center gap-2">
                        {showDelete && onDelete && (
                            <Button variant="destructive" onClick={onDelete}>
                                Delete
                            </Button>
                        )}
                        {showArchive && onArchive && onRestore && (
                            <Button
                                variant="secondary"
                                onClick={isArchived ? onRestore : onArchive}
                            >
                                {isArchived ? 'Restore' : 'Archive'}
                            </Button>
                        )}
                        <Button onClick={onSave}>Save</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}