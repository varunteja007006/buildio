import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { SpeechSettingsForm } from "@/components/account/speech-settings-form";
import { AppBreadcrumb } from "@/components/app-breadcrumb";

export default function AccountPage() {
  return (
    <>
      <AppBreadcrumb
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Account" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">Account settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal preferences.
          </p>
        </div>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Text to speech</CardTitle>
            <CardDescription>
              Choose how assistant responses are read aloud.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpeechSettingsForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
