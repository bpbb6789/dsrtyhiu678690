import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Users } from "lucide-react";

interface JoinChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    id: number;
    title: string;
    category: string;
    amount: string;
    description?: string;
  };
  userBalance: number;
}

export function JoinChallengeModal({
  isOpen,
  onClose,
  challenge,
  userBalance,
}: JoinChallengeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSide, setSelectedSide] = useState<"YES" | "NO" | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  
  const stakeAmount = parseInt(challenge.amount) || 0;

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSide) {
        throw new Error("Please select YES or NO");
      }

      if (stakeAmount <= 0) {
        throw new Error("Invalid stake amount");
      }

      if (stakeAmount > userBalance) {
        throw new Error("Insufficient balance");
      }

      return await apiRequest("POST", `/api/challenges/${challenge.id}/join`, {
        stake: selectedSide,
      });
    },
    onSuccess: (result) => {
      setIsWaiting(true);
      
      // Differentiate between instant match and queue waiting
      if (result.match) {
        // Instant match found!
        toast({
          title: "✅ Matched!",
          description: `Opponent found! ₦${stakeAmount} locked in escrow.`,
        });
      } else {
        // Added to queue, waiting for opponent
        toast({
          title: "⏳ Queued for matching",
          description: `Position ${result.queuePosition} in queue. ₦${stakeAmount} held in escrow.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });

      setTimeout(() => {
        onClose();
        setIsWaiting(false);
        setSelectedSide(null);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    joinMutation.mutate();
  };

  const isBalanceSufficient = userBalance >= stakeAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-xs p-3 rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="w-4 h-4 text-yellow-500" />
            Join Challenge
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">Pick your prediction</DialogDescription>
        </DialogHeader>
         
        <div className="space-y-4 py-2">
          {/* Compact Challenge Info */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/30 rounded-md p-2">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{challenge.title}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-700 border-0">{challenge.category}</Badge>
                <span className="text-xs">Stake: ₦{stakeAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{isBalanceSufficient ? '✓ You have funds' : '✗ Insufficient'}</div>
              <div className="mt-1">Balance: ₦{userBalance.toLocaleString()}</div>
            </div>
          </div>

          {/* Choice Selection (compact) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedSide("YES")}
              className={`py-2 rounded-md text-sm font-semibold transition-all ${
                selectedSide === "YES" ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white'
              }`}
              data-testid="button-choice-yes"
            >
              ✓ YES
            </button>
            <button
              onClick={() => setSelectedSide("NO")}
              className={`py-2 rounded-md text-sm font-semibold transition-all ${
                selectedSide === "NO" ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-white'
              }`}
              data-testid="button-choice-no"
            >
              ✗ NO
            </button>
          </div>

          {/* Waiting State (compact) */}
          {isWaiting && (
            <div className="p-2 text-center text-sm text-slate-600 bg-slate-50 dark:bg-slate-800/30 rounded-md">Processing... Your stake is locked. Finding a match...</div>
          )}
        </div>

        {/* Action Buttons (compact) */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleJoin}
            disabled={!selectedSide || !isBalanceSufficient || joinMutation.isPending}
            className="w-full border-0"
            size="sm"
            data-testid="button-confirm-join"
          >
            {joinMutation.isPending ? "Joining..." : "Join"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
