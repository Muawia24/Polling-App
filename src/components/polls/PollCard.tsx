import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerActions } from "./OwnerActions";

export interface PollCardProps {
  id: string;
  title: string;
  description?: string;
  totalVotes?: number;
  createdBy?: string | null;
}

export function PollCard({ id, title, description, totalVotes, createdBy }: PollCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link href={`/polls/${id}`} className="flex-1">
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            {description ? (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            ) : null}
          </Link>
          <OwnerActions pollId={id} createdBy={createdBy ?? null} />
        </div>
      </CardHeader>
      {typeof totalVotes === "number" ? (
        <CardContent>
          <p className="text-xs text-gray-500">{totalVotes} votes</p>
        </CardContent>
      ) : null}
    </Card>
  );
} 