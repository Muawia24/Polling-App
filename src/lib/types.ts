export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  options?: PollOption[];
}


