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
  endDate?: Date;
}

export interface EditPoll {
  id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
}

export interface PollOptionEdit {
  option_text: string;
  position: number;
}


