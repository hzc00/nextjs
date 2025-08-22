import { useGlobalStore } from "@/lib/use-global-store";
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

const AlertDialogProvider = () => {
  const { alertOpen, alertConfig, updateAlertOpen } = useGlobalStore();

  const handleConfirm = () => {
    alertConfig?.onConfirm?.();
    updateAlertOpen(false);
  };
  const handleCancel = () => {
    alertConfig?.onCancel?.();
    updateAlertOpen(false);
  };
  if (!alertConfig) return null;
  return (
    <AlertDialog open={alertOpen} onOpenChange={updateAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertConfig.title || "Confirmation Required"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {alertConfig.description ||
              "Are you sure you want to perform this action?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {" "}
            {alertConfig.cancelLabel || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {" "}
            {alertConfig.confirmLabel || "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogProvider;
