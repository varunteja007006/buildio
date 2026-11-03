"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Power } from "lucide-react";
import { toast } from "sonner";

const clearLocalStorage = (): void => {
  localStorage.clear();
};

const performReset = (): void => {
  clearLocalStorage();
  window.location.href = "/";
};

export function LogoutBtn() {
  const resetBtn = () => {
    toast.success("Account reset successful");
    performReset();
  };

  return (
    <Tooltip>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" className="cursor-pointer">
              <Power />
            </Button>
          </TooltipTrigger>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will delete your profile and
              you will not be able to access the related data. Continue if you
              are facing issues with the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetBtn}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TooltipContent>
        <p>Reset the account</p>
      </TooltipContent>
    </Tooltip>
  );
}
