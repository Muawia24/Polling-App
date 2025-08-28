import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState({ title, actionHref, actionText }: { title: string; actionHref?: string; actionText?: string }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      {actionHref ? (
        <CardContent>
          <Button asChild>
            <Link href={actionHref}>{actionText ?? "Create"}</Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}


