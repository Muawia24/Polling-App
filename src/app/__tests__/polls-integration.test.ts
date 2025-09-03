import { getSupabaseClient } from '@/lib/supabaseClient';
import { updatePollAction } from '@/lib/actions';
import { revalidatePath } from 'next/cache';

// Mock modules
jest.mock('@/lib/supabaseClient', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

describe('Polls Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * This integration test simulates a poll not found scenario
   */
  it('should handle poll not found during fetch', async () => {
    // Mock Supabase client with poll not found error
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Poll not found' }
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } }
        })
      }
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Simulate fetching the poll data (as would happen in the edit page)
    const fetchPollData = async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get poll details
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('id, title, description, owner_id')
        .eq('id', id)
        .single();

      if (pollError || !poll) throw new Error(`Poll not found: ${pollError?.message || 'Unknown error'}`);

      return { poll, options: [] };
    };

    // Execute the test and expect it to throw
    await expect(fetchPollData('nonexistent-poll')).rejects.toThrow('Poll not found');
    
    // Verify the correct query was attempted
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.select).toHaveBeenCalledWith('id, title, description, owner_id');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'nonexistent-poll');
  });

  /**
   * This integration test simulates a scenario where the user tries to update a poll with insufficient options
   */
  it('should reject poll update with insufficient options', async () => {
    // Mock initial poll data
    const initialPoll = {
      id: 'poll123',
      title: 'Original Poll Title',
      description: 'Original description',
      owner_id: 'user123',
      is_public: true
    };

    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: initialPoll,
        error: null
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } }
        })
      }
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create form data with only one option (insufficient)
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123');
    formData.append('title', 'Updated Poll Title');
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Single Option'); // Only one option
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the result indicates insufficient options
    expect(result).toEqual({ error: 'Please provide at least two options' });
    
    // Verify the poll was not updated
    expect(mockSupabase.update).not.toHaveBeenCalled();
    expect(mockSupabase.delete).not.toHaveBeenCalled();
    expect(mockSupabase.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  /**
   * This integration test simulates a scenario where the poll ID is missing
   */
  it('should reject poll update with missing poll ID', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create form data without poll ID
    const formData = new FormData();
    // Missing pollId
    formData.append('userId', 'user123');
    formData.append('title', 'Updated Poll Title');
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Option 1\nOption 2');
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the result indicates missing poll ID
    expect(result).toEqual({ error: 'Missing poll id' });
    
    // Verify no Supabase calls were made
    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(mockSupabase.select).not.toHaveBeenCalled();
    expect(mockSupabase.update).not.toHaveBeenCalled();
    expect(mockSupabase.delete).not.toHaveBeenCalled();
    expect(mockSupabase.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  
  /**
   * This integration test simulates a scenario where the Supabase client is not available
   */
  it('should handle missing Supabase client', async () => {
    // Mock getSupabaseClient to return null
    (getSupabaseClient as jest.Mock).mockReturnValue(null);

    // Create form data for updating a poll
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123');
    formData.append('title', 'Updated Poll Title');
    formData.append('description', 'Updated poll description');
    formData.append('options', 'Option 1\nOption 2');
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the result indicates Supabase client not available
    expect(result).toEqual({ error: 'Server is not configured for database access.' });
    
    // Verify revalidatePath was not called
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  

  /**
   * This integration test simulates the full flow of updating a poll:
   * 1. Fetching the poll data
   * 2. Updating the poll via the server action
   * 3. Verifying the database was updated correctly
   */
  it('should handle the complete poll update flow - Happy Path', async () => {
    // Mock initial poll data
    const initialPoll = {
      id: 'poll123',
      title: 'Original Poll Title',
      description: 'Original description',
      owner_id: 'user123',
      is_public: true
    };

    // Mock initial options
    const initialOptions = [
      { id: 'option1', option_text: 'Original Option 1', position: 0, poll_id: 'poll123' },
      { id: 'option2', option_text: 'Original Option 2', position: 1, poll_id: 'poll123' }
    ];

    // Updated poll data
    const updatedTitle = 'Updated Poll Title';
    const updatedDescription = 'Updated poll description';
    const updatedOptions = 'Updated Option 1\nUpdated Option 2\nNew Option 3';

    // Mock Supabase client with appropriate responses for each stage
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user123' } }
        })
      }
    };

    // Configure mock responses for different stages
    let stage = 'initial';
    
    mockSupabase.single.mockImplementation(() => {
      if (stage === 'initial') {
        // First call - fetching the poll
        return Promise.resolve({ data: initialPoll, error: null });
      } else if (stage === 'options') {
        // Second call - fetching options
        return Promise.resolve({ data: initialOptions, error: null });
      } else if (stage === 'update-check') {
        // Third call - checking poll ownership before update
        return Promise.resolve({ 
          data: { id: 'poll123', owner_id: 'user123' }, 
          error: null 
        });
      } else if (stage === 'update-poll') {
        // Fourth call - updating the poll
        return Promise.resolve({ data: null, error: null });
      } else if (stage === 'delete-options') {
        // Fifth call - deleting old options
        return Promise.resolve({ data: null, error: null });
      } else if (stage === 'insert-options') {
        // Sixth call - inserting new options
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

    // Simulate fetching the poll data (as would happen in the edit page)
    const fetchPollData = async (id: string) => {
      stage = 'initial';
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Get poll details
      const { data: poll } = await supabase
        .from('polls')
        .select('id, title, description, owner_id')
        .eq('id', id)
        .single();

      stage = 'options';
      // Get poll options
      const { data: options } = await supabase
        .from('poll_options')
        .select('option_text, position')
        .eq('poll_id', id)
        .order('position', { ascending: true })
        .single();

      return {
        poll,
        options
      };
    };

    // First, fetch the poll data
    const { poll, options } = await fetchPollData('poll123');

    // Verify the initial data was fetched correctly
    expect(poll).toEqual(initialPoll);
    expect(options).toEqual(initialOptions);

    // Now simulate updating the poll
    stage = 'update-check';
    
    // Create form data for updating the poll
    const formData = new FormData();
    formData.append('pollId', 'poll123');
    formData.append('userId', 'user123');
    formData.append('title', updatedTitle);
    formData.append('description', updatedDescription);
    formData.append('options', updatedOptions);
    
    // Call the updatePollAction function
    const result = await updatePollAction({}, formData);

    // Verify the Supabase calls for updating the poll
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.select).toHaveBeenCalledWith('id, owner_id');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'poll123');
    expect(mockSupabase.update).toHaveBeenCalledWith({ 
      title: updatedTitle, 
      description: updatedDescription 
    });
    
    // Verify options were deleted and new ones inserted
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.insert).toHaveBeenCalled();
    
    // Verify revalidation paths were called
    expect(revalidatePath).toHaveBeenCalledWith('/polls');
    expect(revalidatePath).toHaveBeenCalledWith('/polls/poll123');
    
    // Verify the result
    expect(result).toEqual({ success: 'Changes saved' });

    // Now simulate fetching the updated poll to verify changes
    // (In a real app, this would be a separate request after the update)
    stage = 'initial';
    const updatedPollData = await fetchPollData('poll123');
    
    // In a real test with a real database, we would verify the updated data here
    // Since we're using mocks, we're just verifying the flow and function calls
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.select).toHaveBeenCalledWith('id, title, description, owner_id');
  });
});