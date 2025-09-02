"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { submitVoteAction, VoteFormState } from "@/lib/actions";
import { useFormState } from "react-dom";
import { generateFingerprint } from "@/lib/fingerprint";

export interface VotingOption {
  id: string;
  text: string;
  votes: number;
}

export interface VotingFormProps {
  pollId: string;
  options: VotingOption[];
}

export default function VotingForm({ pollId, options }: VotingFormProps) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Generate fingerprint for anonymous users
  useEffect(() => {
    async function getFingerprint() {
      if (!user) {
        const fp = await generateFingerprint();
        setFingerprint(fp);
      }
      setIsLoading(false);
    }
    
    getFingerprint();
  }, [user]);
  
  // Initialize form state with the server action
  const initialState: VoteFormState = {};
  const [formState, formAction] = useFormState(submitVoteAction, initialState);
  
  // Show success message when vote is recorded
  if (formState.success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-green-800">Thank you for voting!</h3>
            <p className="text-sm text-green-600">{formState.success}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()} // Reload to see updated results
              className="mt-2"
            >
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while generating fingerprint
  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-pulse text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden inputs for form data */}
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="userId" value={user?.id || ""} />
      <input type="hidden" name="fingerprint" value={fingerprint} />
      
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="optionId"
              value={option.id}
              checked={selectedOption === option.id}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              required
            />
            <span className="text-sm font-medium">{option.text}</span>
            <span className="text-xs text-gray-500 ml-auto">({option.votes} votes)</span>
          </label>
        ))}
      </div>
      
      {/* Display form errors */}
      {formState.error && (
        <p className="text-sm text-red-600">{formState.error}</p>
      )}
      
      {/* Show a message if user is not logged in but can still vote anonymously */}
      {!user && (
        <p className="text-xs text-gray-500 italic">
          You are voting anonymously. The system will prevent duplicate votes based on your browser fingerprint.
        </p>
      )}
      
      <Button 
        type="submit" 
        disabled={!selectedOption}
        className="w-full"
      >
        Submit Vote
      </Button>
    </form>
  );
}
