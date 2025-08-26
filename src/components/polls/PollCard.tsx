import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface PollCardProps {
  id: string;
  title: string;
  description?: string;
  totalVotes?: number;
}

export function PollCard({ id, title, description, totalVotes }: PollCardProps) {
  return (
    <Link href={`/polls/${id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {description ? (
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          ) : null}
        </CardHeader>
        {typeof totalVotes === "number" ? (
          <CardContent>
            <p className="text-xs text-gray-500">{totalVotes} votes</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
} 