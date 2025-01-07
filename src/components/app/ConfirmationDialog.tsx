// components/app/ConfirmationDialog.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConfirmationDialogProps {
    type: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmationDialog({
    type,
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel"
}: ConfirmationDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await onConfirm();
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground"
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type ConfirmationProps = Pick<ConfirmationDialogProps, 'type' | 'open' | 'onOpenChange' | 'onConfirm' | 'title'>;

export const DeleteConfirmationDialog: React.FC<ConfirmationProps> = (props) => (
    <ConfirmationDialog
        {...props}
        description={`Are you sure you want to delete "${props.title.length > 50 ? props.title.slice(0, 50) + '...' : props.title}"?`}
        confirmText="Delete"
    />
);

export const ArchiveConfirmationDialog: React.FC<ConfirmationProps> = (props) => (
    <ConfirmationDialog
        {...props}
        description={`Are you sure you want to archive "${props.title.length > 50 ? props.title.slice(0, 50) + '...' : props.title}"?`}
        confirmText="Archive"
    />
);

export const RestoreConfirmationDialog: React.FC<ConfirmationProps> = (props) => (
    <ConfirmationDialog
        {...props}
        description={`Are you sure you want to restore "${props.title.length > 50 ? props.title.slice(0, 50) + '...' : props.title}"?`}
        confirmText="Restore"
    />
);