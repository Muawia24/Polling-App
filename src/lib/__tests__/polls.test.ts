import { getSupabaseClient } from '../supabaseClient';
import { updatePollAction } from '../actions';
import { revalidatePath } from 'next/cache';

// Mock modules
jest.mock('../supabaseClient', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Polls API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Integration Test: Test updating a poll - Unauthorized User
  it('should reject poll update from unauthorized user', async () => {
    // Mock Supabase client with poll owned by different user
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'poll123', owner_id: 'different-user' }, // Different owner
        error: null
      })
    };
    
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create form data for updating a poll
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123'); // Not the owner
    formData.append('title', 'Updated Poll Title');
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Updated Option 1\nUpdated Option 2\nNew Option 3');
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the result indicates unauthorized access
    expect(result).toEqual({ error: 'Not authorized' });
    
    // Verify the poll was not updated
    expect(mockSupabase.update).not.toHaveBeenCalled();
    expect(mockSupabase.delete).not.toHaveBeenCalled();
    expect(mockSupabase.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  // Integration Test: Test updating a poll - Missing Required Fields
  it('should reject poll update with missing required fields', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'poll123', owner_id: 'user123' },
        error: null
      })
    };
    
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create form data with missing title
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123');
    // Missing title
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Updated Option 1\nUpdated Option 2\nNew Option 3');
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the result indicates missing title
    expect(result).toEqual({ error: 'Title is required' });
    
    // Verify the poll was not updated
    expect(mockSupabase.update).not.toHaveBeenCalled();
    expect(mockSupabase.delete).not.toHaveBeenCalled();
    expect(mockSupabase.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  // Integration Test: Test updating a poll - Database Error
  it('should handle database errors during poll update', async () => {
    // Mock Supabase client with error on update
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };
    
    // Configure mock to return poll data for ownership check
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValue({
      data: { id: 'poll123', owner_id: 'user123' },
      error: null
    });
    
    // Mock update to return an error
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockImplementation(() => {
      return {
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123', owner_id: 'user123' },
          error: null
        })
      };
    });
    
    // Mock the update operation to return an error
    mockSupabase.from().update.mockImplementation(() => {
      return {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database update error' }
        })
      };
    });
    
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create form data for updating a poll
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123');
    formData.append('title', 'Updated Poll Title');
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Updated Option 1\nUpdated Option 2\nNew Option 3');
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the result indicates a database error
    expect(result).toEqual({ error: 'Database update error' });
  });

  // Unit Test 1: Test fetching a poll by ID - Happy Path
  it('should fetch a poll by ID', async () => {
    // Mock poll data
    const mockPoll = {
      id: 'poll123',
      title: 'Test Poll',
      description: 'Test Description',
      owner_id: 'user123',
      is_public: true,
      expires_at: null
    };

    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPoll,
        error: null
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } }
        })
      }
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Function to fetch a poll
    const fetchPoll = async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get poll details
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .select('id, title, description, owner_id, is_public, expires_at')
        .eq('id', id)
        .single();

      if (pollErr || !poll) throw new Error('Poll not found');

      return poll;
    };

    // Execute the test
    const result = await fetchPoll('poll123');

    // Assertions
    expect(result).toEqual(mockPoll);
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.select).toHaveBeenCalledWith('id, title, description, owner_id, is_public, expires_at');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'poll123');
  });

  // Unit Test 1.1: Test fetching a poll by ID - Poll Not Found
  it('should throw an error when poll is not found', async () => {
    // Mock Supabase client with no poll found
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' }
      })
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Function to fetch a poll
    const fetchPoll = async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get poll details
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .select('id, title, description, owner_id, is_public, expires_at')
        .eq('id', id)
        .single();

      if (pollErr || !poll) throw new Error('Poll not found');

      return poll;
    };

    // Execute the test and expect an error
    await expect(fetchPoll('nonexistent')).rejects.toThrow('Poll not found');
  });

  // Unit Test 1.2: Test fetching a poll by ID - Supabase Client Not Available
  it('should throw an error when Supabase client is not available', async () => {
    // Mock getSupabaseClient to return null
    (getSupabaseClient as jest.Mock).mockReturnValue(null);

    // Function to fetch a poll
    const fetchPoll = async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get poll details
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .select('id, title, description, owner_id, is_public, expires_at')
        .eq('id', id)
        .single();

      if (pollErr || !poll) throw new Error('Poll not found');

      return poll;
    };

    // Execute the test and expect an error
    await expect(fetchPoll('poll123')).rejects.toThrow('Supabase client not available');
  });

  // Unit Test 2: Test listing all polls - Happy Path
  it('should list all polls', async () => {
    // Mock polls data
    const mockPolls = [
      {
        id: 'poll1',
        title: 'Poll 1',
        description: 'Description 1',
        owner_id: 'user1',
        is_public: true,
        expires_at: null,
        option_counts: [
          { option_text: 'Option 1', count: 5 },
          { option_text: 'Option 2', count: 3 }
        ]
      },
      {
        id: 'poll2',
        title: 'Poll 2',
        description: 'Description 2',
        owner_id: 'user2',
        is_public: true,
        expires_at: null,
        option_counts: [
          { option_text: 'Option A', count: 10 },
          { option_text: 'Option B', count: 7 }
        ]
      }
    ];

    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockImplementation((table) => {
        if (table === 'polls') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockPolls.map(({ option_counts, ...poll }) => poll),
              error: null
            })
          };
        } else if (table === 'poll_option_counts') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: mockPolls.flatMap(poll => 
                poll.option_counts.map(option => ({
                  poll_id: poll.id,
                  ...option
                }))
              ),
              error: null
            })
          };
        }
        return {};
      })
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Function to list all polls
    const listPolls = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get all polls
      const { data: polls, error: pollsErr } = await supabase
        .from('polls')
        .select('id, title, description, owner_id, is_public, expires_at')
        .order('created_at', { ascending: false });

      if (pollsErr) throw new Error('Failed to fetch polls');
      if (!polls || polls.length === 0) return [];

      // Get vote counts for all poll options
      const { data: optionCounts, error: countsErr } = await supabase
        .from('poll_option_counts')
        .select('poll_id, option_text, count')
        .in('poll_id', polls.map(p => p.id));

      if (countsErr) throw new Error('Failed to fetch poll options');

      // Combine polls with their options
      return polls.map(poll => ({
        ...poll,
        option_counts: optionCounts
          ? optionCounts
              .filter(oc => oc.poll_id === poll.id)
              .map(({ poll_id, ...rest }) => rest)
          : []
      }));
    };

    // Execute the test
    const result = await listPolls();

    // Assertions
    expect(result).toEqual(mockPolls);
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.from).toHaveBeenCalledWith('poll_option_counts');
  });

  // Unit Test 2.1: Test listing all polls - Empty Results
  it('should return empty array when no polls exist', async () => {
    // Mock Supabase client with empty polls result
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Function to list all polls
    const listPolls = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get all polls
      const { data: polls, error: pollsErr } = await supabase
        .from('polls')
        .select('id, title, description, owner_id, is_public, expires_at')
        .order('created_at', { ascending: false });

      if (pollsErr) throw new Error('Failed to fetch polls');
      if (!polls || polls.length === 0) return [];

      // Get vote counts for all poll options
      const { data: optionCounts, error: countsErr } = await supabase
        .from('poll_option_counts')
        .select('poll_id, option_text, count')
        .in('poll_id', polls.map(p => p.id));

      if (countsErr) throw new Error('Failed to fetch poll options');

      // Combine polls with their options
      return polls.map(poll => ({
        ...poll,
        option_counts: optionCounts
          ? optionCounts
              .filter(oc => oc.poll_id === poll.id)
              .map(({ poll_id, ...rest }) => rest)
          : []
      }));
    };

    // Execute the test
    const result = await listPolls();

    // Assertions
    expect(result).toEqual([]);
  });

  // Unit Test 2.2: Test listing all polls - Database Error
  it('should throw an error when database query fails', async () => {
    // Mock Supabase client with error
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Function to list all polls
    const listPolls = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get all polls
      const { data: polls, error: pollsErr } = await supabase
        .from('polls')
        .select('id, title, description, owner_id, is_public, expires_at')
        .order('created_at', { ascending: false });

      if (pollsErr) throw new Error('Failed to fetch polls');
      if (!polls || polls.length === 0) return [];

      return polls;
    };

    // Execute the test and expect an error
    await expect(listPolls()).rejects.toThrow('Failed to fetch polls');
  });

  // Integration Test: Test updating a poll - Happy Path
  it('should update a poll successfully', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'poll123', owner_id: 'user123' },
        error: null
      })
    };
    
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create form data for updating a poll
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123');
    formData.append('title', 'Updated Poll Title');
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Updated Option 1\nUpdated Option 2\nNew Option 3');
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.select).toHaveBeenCalledWith('id, owner_id');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'poll123');
    expect(mockSupabase.update).toHaveBeenCalledWith({ 
      title: 'Updated Poll Title', 
      description: 'Updated poll description' 
    });
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.insert).toHaveBeenCalled();
    
    // Verify revalidation paths were called
    expect(revalidatePath).toHaveBeenCalledWith('/polls');
    expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
    
    // Verify the result
    expect(result).toEqual({ success: 'Changes saved' });
  });
});