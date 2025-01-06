// ConfirmationDialog.tsx
import React, { JSX } from 'react';
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

export interface ConfirmationDialogProps {
    type: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
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
}: ConfirmationDialogProps): JSX.Element {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type ConfirmationProps = Pick<ConfirmationDialogProps, 'type' | 'open' | 'onOpenChange' | 'onConfirm' | 'title'>;

export const DeleteConfirmationDialog: React.FC<ConfirmationProps> = ({ type, title, open, onOpenChange, onConfirm }) => (
    <ConfirmationDialog
        type={type}
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title={`Delete ${type}`}
        description={`Are you sure you want to delete "${title.length > 50 ? title.slice(0, 50) + '...' : title}"?`}
        confirmText="Delete"
    />
 );
 
 export const ArchiveConfirmationDialog: React.FC<ConfirmationProps> = ({ type, title, open, onOpenChange, onConfirm }) => (
    <ConfirmationDialog
        type={type}
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title={`Archive ${type}`}
        description={`Are you sure you want to archive "${title.length > 50 ? title.slice(0, 50) + '...' : title}"?`}
        confirmText="Archive"
    />
 );

 export const RestoreConfirmationDialog: React.FC<ConfirmationProps> = ({ type, title, open, onOpenChange, onConfirm }) => (
    <ConfirmationDialog
        type={type}
        open={open}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title={`Restore ${type}`}
        description={`Are you sure you want to restore "${title.length > 50 ? title.slice(0, 50) + '...' : title}"?`}
        confirmText="Restore"
    />
 );
 