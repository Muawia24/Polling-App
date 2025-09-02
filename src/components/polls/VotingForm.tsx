"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

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
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    if (!user) {
      setError("You must be logged in to vote");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHasVoted(true);
    setIsSubmitting(false);
  };

  if (hasVoted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-green-800">Thank you for voting!</h3>
            <p className="text-sm text-green-600">Your vote has been recorded.</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setHasVoted(false)}
              className="mt-2"
            >
              Vote again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="vote"
              value={option.id}
              checked={selectedOption === option.id}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">{option.text}</span>
            <span className="text-xs text-gray-500 ml-auto">({option.votes} votes)</span>
          </label>
        ))}
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <Button 
        type="submit" 
        disabled={!selectedOption || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Vote"}
      </Button>
    </form>
  );
}
