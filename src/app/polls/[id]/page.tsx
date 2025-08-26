import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { id: string };
}

export default function PollDetailPage({ params }: PageProps) {
  const { id } = params;
  // Placeholder poll data; wire to Supabase later
  const poll = {
    id,
    title: `Poll #${id}`,
    description: "This is a placeholder poll detail page.",
    options: [
      { id: "a", text: "Option A", votes: 3 },
      { id: "b", text: "Option B", votes: 5 },
      { id: "c", text: "Option C", votes: 1 },
    ],
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{poll.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{poll.description}</p>
          <ul className="space-y-2">
            {poll.options.map((opt) => (
              <li key={opt.id} className="flex items-center justify-between rounded border p-3">
                <span>{opt.text}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{opt.votes} votes</span>
                  <Button size="sm" variant="secondary">Vote</Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 