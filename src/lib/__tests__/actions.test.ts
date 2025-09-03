// Mock the modules first
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  revalidatePath: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('../supabaseClient', () => ({
  getSupabaseClient: jest.fn(),
}));

// Import after mocking
import { createPollAction, updatePollAction, deletePollAction, submitVoteAction } from '../actions';
import { getSupabaseClient } from '../supabaseClient';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
// Mocks are already defined above

describe('Server Actions', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPollAction', () => {
    it('should return error if supabase client is not available', async () => {
      // Mock getSupabaseClient to return null
      (getSupabaseClient as jest.Mock).mockReturnValue(null);

      const formData = new FormData();
      const result = await createPollAction({}, formData);

      expect(result).toEqual({ error: 'Server is not configured for database access.' });
    });

    it('should return error if title is missing', async () => {
      // Mock getSupabaseClient to return a mock client
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('userId', 'user123');
      formData.append('title', ''); // Empty title
      
      const result = await createPollAction({}, formData);

      expect(result).toEqual({ error: 'Title is required' });
    });

    it('should return error if user is not logged in', async () => {
      // Mock getSupabaseClient to return a mock client
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('title', 'Test Poll');
      // No userId provided
      
      const result = await createPollAction({}, formData);

      expect(result).toEqual({ error: 'You must be logged in to create a poll' });
    });

    it('should return error if less than two options are provided', async () => {
      // Mock getSupabaseClient to return a mock client
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('userId', 'user123');
      formData.append('options', 'Option 1'); // Only one option
      
      const result = await createPollAction({}, formData);

      expect(result).toEqual({ error: 'Please provide at least two options' });
    });

    it('should create a poll successfully', async () => {
      // Mock Supabase client with successful responses
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123' },
          error: null
        }),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('description', 'Test Description');
      formData.append('userId', 'user123');
      formData.append('options', 'Option 1\nOption 2\nOption 3');
      
      const result = await createPollAction({}, formData);

      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        title: 'Test Poll',
        description: 'Test Description',
        owner_id: 'user123'
      });
      expect(revalidatePath).toHaveBeenCalledWith('/polls');
      expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
      expect(result).toEqual({ success: 'Poll created successfully' });
    });

    it('should handle poll insertion error', async () => {
      // Mock Supabase client with an error response for poll insertion
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      };
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('title', 'Test Poll');
      formData.append('userId', 'user123');
      formData.append('options', 'Option 1\nOption 2');
      
      const result = await createPollAction({}, formData);

      expect(result).toEqual({ error: 'Database error' });
    });
  });

  describe('updatePollAction', () => {
    it('should return error if supabase client is not available', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);

      const formData = new FormData();
      const result = await updatePollAction({}, formData);

      expect(result).toEqual({ error: 'Server is not configured for database access.' });
    });

    it('should return error if poll id is missing', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('title', 'Updated Poll');
      // No pollId provided
      
      const result = await updatePollAction({}, formData);

      expect(result).toEqual({ error: 'Missing poll id' });
    });

    it('should return error if title is missing', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('title', ''); // Empty title
      
      const result = await updatePollAction({}, formData);

      expect(result).toEqual({ error: 'Title is required' });
    });

    it('should return error if less than two options are provided', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('title', 'Updated Poll');
      formData.append('options', 'Option 1'); // Only one option
      
      const result = await updatePollAction({}, formData);

      expect(result).toEqual({ error: 'Please provide at least two options' });
    });

    it('should return error if poll is not found', async () => {
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

      const formData = new FormData();
      formData.append('pollId', 'nonexistent');
      formData.append('title', 'Updated Poll');
      formData.append('options', 'Option 1\nOption 2');
      
      const result = await updatePollAction({}, formData);

      expect(result).toEqual({ error: 'Poll not found' });
    });

    it('should return error if user is not authorized', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123', owner_id: 'owner123' },
          error: null
        })
      };
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('userId', 'differentUser'); // Different user than owner
      formData.append('title', 'Updated Poll');
      formData.append('options', 'Option 1\nOption 2');
      
      const result = await updatePollAction({}, formData);

      expect(result).toEqual({ error: 'Not authorized' });
    });

    it('should update a poll successfully', async () => {
      // Mock Supabase client with successful responses
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123', owner_id: 'user123' },
          error: null
        }),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };
      
      // Mock the update, delete, and insert operations to return success
      mockSupabase.update.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      }));
      
      mockSupabase.delete.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      }));
      
      mockSupabase.insert.mockResolvedValue({ error: null });
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('userId', 'user123'); // Same as owner_id
      formData.append('title', 'Updated Poll');
      formData.append('description', 'Updated Description');
      formData.append('options', 'Option 1\nOption 2\nOption 3');
      
      const result = await updatePollAction({}, formData);

      expect(revalidatePath).toHaveBeenCalledWith('/polls');
      expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
      expect(result).toEqual({ success: 'Changes saved' });
    });
  });

  describe('deletePollAction', () => {
    it('should return error if supabase client is not available', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);

      const formData = new FormData();
      const result = await deletePollAction({}, formData);

      expect(result).toEqual({ error: 'Server is not configured for database access.' });
    });

    it('should return error if poll id is missing', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      // No pollId provided
      
      const result = await deletePollAction({}, formData);

      expect(result).toEqual({ error: 'Missing poll id' });
    });

    it('should return error if poll is not found', async () => {
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

      const formData = new FormData();
      formData.append('pollId', 'nonexistent');
      
      const result = await deletePollAction({}, formData);

      expect(result).toEqual({ error: 'Poll not found' });
    });

    it('should return error if user is not authorized', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123', owner_id: 'owner123' },
          error: null
        })
      };
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('userId', 'differentUser'); // Different user than owner
      
      const result = await deletePollAction({}, formData);

      expect(result).toEqual({ error: 'Not authorized' });
    });

    it('should delete a poll successfully', async () => {
      // Mock Supabase client with successful responses
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123', owner_id: 'user123' },
          error: null
        })
      };
      
      // Mock the delete operation to return success
      mockSupabase.delete.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ error: null })
      }));
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('userId', 'user123'); // Same as owner_id
      
      await deletePollAction({}, formData);

      expect(revalidatePath).toHaveBeenCalledWith('/polls');
      expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
      expect(redirect).toHaveBeenCalledWith('/polls');
    });
  });

  describe('submitVoteAction', () => {
    it('should return error if supabase client is not available', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);

      const formData = new FormData();
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'Server is not configured for database access.' });
    });

    it('should return error if poll id is missing', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('optionId', 'option123');
      // No pollId provided
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'Missing poll ID' });
    });

    it('should return error if option id is missing', async () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({});

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      // No optionId provided
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'No option selected' });
    });

    it('should return error if poll is not found', async () => {
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

      const formData = new FormData();
      formData.append('pollId', 'nonexistent');
      formData.append('optionId', 'option123');
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'Poll not found' });
    });

    it('should return error if poll is not public', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'poll123', is_public: false },
          error: null
        })
      };
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option123');
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'This poll is not available for voting' });
    });

    it('should return error if poll has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { 
            id: 'poll123', 
            is_public: true,
            expires_at: pastDate.toISOString()
          },
          error: null
        })
      };
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option123');
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'This poll has expired' });
    });

    it('should return error if option is invalid', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
      };
      
      // First call for poll check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'poll123', is_public: true },
        error: null
      });
      
      // Second call for option check
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Option not found' }
      });
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'invalidOption');
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'Invalid option selected' });
    });

    it('should return error if user has already voted', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      };
      
      // First call for poll check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'poll123', is_public: true },
        error: null
      });
      
      // Second call for option check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'option123' },
        error: null
      });
      
      // Third call for existing vote check
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'vote123' },
        error: null
      });
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option123');
      formData.append('userId', 'user123');
      
      const result = await submitVoteAction({}, formData);

      expect(result).toEqual({ error: 'You have already voted on this poll' });
    });

    it('should record a vote successfully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      };
      
      // First call for poll check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'poll123', is_public: true },
        error: null
      });
      
      // Second call for option check
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'option123' },
        error: null
      });
      
      // Third call for existing vote check
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      // Mock the insert operation to return success
      mockSupabase.insert.mockResolvedValue({ error: null });
      
      (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const formData = new FormData();
      formData.append('pollId', 'poll123');
      formData.append('optionId', 'option123');
      formData.append('userId', 'user123');
      formData.append('fingerprint', 'fp123');
      
      const result = await submitVoteAction({}, formData);

      expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
      expect(result).toEqual({ success: 'Your vote has been recorded' });
    });
  });
});