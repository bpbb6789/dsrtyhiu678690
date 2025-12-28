import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SocialMediaShare } from "@/components/SocialMediaShare";
import {
  MessageCircle,
  Check,
  X,
  Eye,
  Trophy,
  Share2,
  Zap,
  Lock,
} from "lucide-react";
import { CompactShareButton } from "@/components/ShareButton";
import { shareChallenge } from "@/utils/sharing";
import { UserAvatar } from "@/components/UserAvatar";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { useLocation } from "wouter";

// Simple category -> emoji/icon mapping
function CategoryIcon({ category }: { category?: string }) {
  const map: Record<string, string> = {
    general: "📌",
    test: "🧪",
    sports: "⚽",
    politics: "🏛️",
    finance: "💰",
    entertainment: "🎬",
  };

  const icon = (category && map[category.toLowerCase()]) || "📢";
  return (
    <span aria-hidden className="text-sm">
      {icon}
    </span>
  );
}

interface ChallengeCardProps {
  challenge: {
    id: number;
    challenger: string;
    challenged: string;
    title: string;
    description?: string;
    category: string;
    amount: string;
    status: string;
    dueDate?: string;
    createdAt: string;
    adminCreated?: boolean;
    bonusSide?: string;
    bonusMultiplier?: string;
    bonusEndsAt?: string;
    bonusAmount?: number; // Custom bonus amount in naira
    yesStakeTotal?: number;
    noStakeTotal?: number;
    coverImageUrl?: string;
    participantCount?: number;
    commentCount?: number;
    earlyBirdSlots?: number;
    earlyBirdBonus?: number;
    streakBonusEnabled?: boolean;
    convictionBonusEnabled?: boolean;
    firstTimeBonusEnabled?: boolean;
    socialTagBonus?: number;
    challengerUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
    challengedUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
  onChatClick?: (challenge: any) => void;
  onJoin?: (challenge: any) => void;
}

export function ChallengeCard({
  challenge,
  onChatClick,
  onJoin,
}: ChallengeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Check if bonus is active
  const isBonusActive =
    challenge.bonusEndsAt && new Date(challenge.bonusEndsAt) > new Date();

  const getBonusBadge = () => {
    const bonuses = [];
    
    // Original weak side bonus
    if (isBonusActive && challenge.bonusSide) {
      const amount = challenge.bonusAmount ? `₦${challenge.bonusAmount.toLocaleString()}` : `${challenge.bonusMultiplier}x`;
      bonuses.push({
        type: "weak_side",
        label: amount,
        side: challenge.bonusSide,
        description: `Bonus for ${challenge.bonusSide} side`
      });
    }

    // Early Bird
    if (challenge.earlyBirdSlots && challenge.earlyBirdSlots > 0) {
      bonuses.push({
        type: "early_bird",
        label: "Early",
        icon: <Zap className="w-3 h-3" />,
        description: `Bonus for first ${challenge.earlyBirdSlots} users`
      });
    }

    // Streak
    if (challenge.streakBonusEnabled) {
      bonuses.push({
        type: "streak",
        label: "Streak",
        icon: <Trophy className="w-3 h-3" />,
        description: "Win streak bonus active"
      });
    }

    return bonuses;
  };

  const activeBonuses = getBonusBadge();

  // Generate sharing data for the challenge
  const challengeShareData = shareChallenge(
    challenge.id.toString(),
    challenge.title,
    challenge.amount,
  );

  const acceptChallengeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/challenges/${challenge.id}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Challenge Accepted",
        description: "You have successfully accepted the challenge!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineChallengeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/challenges/${challenge.id}`, {
        status: "cancelled",
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Declined",
        description: "You have declined the challenge.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isEnded = challenge.status === 'completed' || (challenge.dueDate && new Date(challenge.dueDate).getTime() <= Date.now());

  const isNewChallenge = !!challenge.createdAt && (Date.now() - new Date(challenge.createdAt).getTime()) < 24 * 60 * 60 * 1000 && !isEnded;

  const getStatusBadge = (status: string) => {
    if (challenge.adminCreated) {
      if (status === "pending_admin" || status === "active") {
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
            Awaiting Result
          </Badge>
        );
      }
      if (status === "completed") {
        return (
          <Badge className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
            Ended
          </Badge>
        );
      }
      if (isNewChallenge) {
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            New
          </Badge>
        );
      }
      return null;
    }

    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
            Live
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
            Ended
          </Badge>
        );
      case "disputed":
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
            Disputed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Check if current user is a participant in this challenge
  const isMyChallenge =
    user?.id === challenge.challenger || user?.id === challenge.challenged;

  // Display challenger vs challenged format for all challenges
  // For admin-created open challenges with no users, show "Open Challenge"
  const isOpenAdminChallenge =
    challenge.adminCreated &&
    challenge.status === "open" &&
    !challenge.challenger &&
    !challenge.challenged;

  const challengerName =
    challenge.challengerUser?.firstName ||
    challenge.challengerUser?.username ||
    "Unknown User";
  const challengedName =
    challenge.challengedUser?.firstName ||
    challenge.challengedUser?.username ||
    "Unknown User";
  
  // Show challenge title for all challenges - avatar pair at bottom shows who has joined
  const isOpenChallenge = challenge.status === "open";
  const displayName = challenge.title;

  // For avatar, show the other user (opponent) if current user is involved, otherwise show challenger
  const otherUser =
    user?.id === challenge.challenger
      ? challenge.challengedUser
      : user?.id === challenge.challenged
        ? challenge.challengerUser
        : challenge.challengerUser;
  const timeAgo = formatDistanceToNow(new Date(challenge.createdAt), {
    addSuffix: true,
  });

  // Helper function to get status text for the card
  const getStatusText = () => {
    switch (challenge.status) {
      case "pending":
        return "Waiting for your response";
      case "active":
        return "Challenge in progress";
      case "completed":
        return "Challenge concluded";
      case "disputed":
        return "Challenge disputed";
      case "cancelled":
        return "Challenge cancelled";
      default:
        return challenge.status;
    }
  };

  // Helper function for compact time format
  const getCompactTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w`;
  };

  // Amounts and potential win (include admin bonusMultiplier if present)
  const amountNum = parseFloat(String(challenge.amount)) || 0;
  const bonusMul = parseFloat(String(challenge.bonusMultiplier || "1.00")) || 1;
  // Total pool is both users' stakes combined
  const totalPool = amountNum * 2;
  const potentialWin = Math.round(totalPool * bonusMul);

  // Do not make the whole card clickable. Only the action buttons (Join, Chat, Share)
  // should be interactive to avoid accidental opens of modals or chat.
  const cardClickProps = {};

  return (
    <Card
      className="border border-slate-200 dark:border-slate-600 theme-transition h-full overflow-hidden"
      {...cardClickProps}
    >
      <CardContent className="p-3 md:p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
          <div className="flex items-start space-x-2 md:space-x-3 min-w-0 flex-1">
            {/* Show cover art for all challenges */}
            {challenge.coverImageUrl ? (
              <div className="flex items-center flex-shrink-0">
                <img
                  src={challenge.coverImageUrl}
                  alt="challenge cover"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center flex-shrink-0">
                <img
                  src="/assets/bantahblue.svg"
                  alt="platform"
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <button
                onClick={() => navigate(`/challenges/${challenge.id}/activity`)}
                className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 line-clamp-1 mb-0.5 hover:text-primary dark:hover:text-primary/80 transition-colors text-left w-full"
                data-testid="link-challenge-detail"
              >
                {displayName}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">
                ₦{amountNum.toLocaleString()} Stake
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {challenge.status === "open" && (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                <Badge className={isNewChallenge ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-none" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-none"}>
                  {isNewChallenge ? "New" : "Open"}
                </Badge>
                {!challenge.adminCreated && (
                  <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-none">
                    P2P
                  </Badge>
                )}
                {activeBonuses.length > 0 && (
                  <Badge className="bg-amber-500 text-white border-none px-2 py-0.5 text-[10px]">
                    {activeBonuses[0].icon}
                    <span className="font-bold ml-1">{activeBonuses[0].label}</span>
                  </Badge>
                )}
                <CompactShareButton
                  shareData={challengeShareData.shareData}
                  className="text-primary h-5 w-5 hover:scale-110 transition-transform"
                />
              </div>
            )}
            {challenge.status !== "open" && getStatusBadge(challenge.status)}
          </div>
        </div>
        
        {/* Bonus badges row (show whenever active bonuses exist) */}
        {activeBonuses.length > 0 && (
          {/* removed separate bonus row; bonus badge will be shown inline next to share icon */}
        )}

        <div className="mb-1.5">
          <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
            {challenge.title}
          </h5>
        </div>

        {(() => {
          // Determine if this is a head-to-head match already filled (non-admin)
          const isHeadToHeadMatched = !challenge.adminCreated && !!challenge.challenger && !!challenge.challenged;
          const hasJoined = user?.id === challenge.challenger || user?.id === challenge.challenged;
          const showJoinButtons = challenge.status === "open" && (!isHeadToHeadMatched || hasJoined);

          if (!showJoinButtons) return null;

          return (
            <div className="flex justify-center mb-2">
              <div className="flex flex-row items-center justify-center h-9 gap-1 px-8 w-full">
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasJoined) {
                        onJoin?.({ ...challenge, selectedSide: "yes" });
                      }
                    }}
                    disabled={hasJoined}
                    className={`flex items-center justify-center text-base font-bold rounded-2xl px-8 py-2 flex-1 transition-opacity ${
                      hasJoined
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/20 hover:opacity-80'
                    }`}
                    title={hasJoined ? "You have already joined this challenge" : ""}
                    data-testid="button-challenge-yes"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasJoined) {
                        onJoin?.({ ...challenge, selectedSide: "no" });
                      }
                    }}
                    disabled={hasJoined}
                    className={`flex items-center justify-center text-base font-bold rounded-2xl px-8 py-2 flex-1 transition-opacity ${
                      hasJoined
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                        : 'text-red-600 dark:text-red-400 bg-red-500/15 dark:bg-red-500/20 hover:opacity-80'
                    }`}
                    title={hasJoined ? "You have already joined this challenge" : ""}
                    data-testid="button-challenge-no"
                  >
                    No
                  </button>
                </>
              </div>
            </div>
          );
        })()}

        <div className="flex items-center justify-between gap-1 mb-2">
          <Badge variant="outline" className="flex flex-col items-center py-1 px-3 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 rounded-xl h-auto min-w-[70px] shadow-sm">
            <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight mb-0.5">Stake</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">₦{amountNum.toLocaleString()}</span>
          </Badge>
          <Badge variant="outline" className="flex flex-col items-center py-1 px-3 bg-emerald-50/40 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 rounded-xl h-auto min-w-[70px] shadow-sm">
            <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 uppercase font-bold tracking-tight mb-0.5">Win</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">₦{potentialWin.toLocaleString()}</span>
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                 onClick={(e) => {
                   e.stopPropagation();
                   if (onChatClick) onChatClick({ ...challenge, amount: String(challenge.amount) });
                 }}>
              <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                {challenge.commentCount ?? 0}
              </span>
            </div>

            {/* Avatar pair with participant count indicator */}
            <div className="flex items-center gap-0.5 bg-slate-100/50 dark:bg-slate-800/50 px-1.5 py-1 rounded-full">
              <div className="flex items-center -space-x-1.5">
                {/* Always show challenger if they exist */}
                {challenge.challengerUser && (
                  <Avatar className="w-4 h-4 ring-1 ring-white dark:ring-slate-800 flex-shrink-0">
                    <AvatarImage
                      src={
                        challenge.challengerUser?.profileImageUrl ||
                        getAvatarUrl(
                          challenge.challengerUser?.id || "",
                          challenge.challengerUser?.username || challengerName,
                        )
                      }
                      alt={challengerName}
                    />
                    <AvatarFallback className="text-[8px] font-bold bg-blue-100 text-blue-700">
                      {challengerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {/* Show challenged user if they exist */}
                {challenge.challengedUser && (
                  <Avatar className="w-4 h-4 ring-1 ring-white dark:ring-slate-800 flex-shrink-0">
                    <AvatarImage
                      src={
                        challenge.challengedUser?.profileImageUrl ||
                        getAvatarUrl(
                          challenge.challengedUser?.id || "",
                          challenge.challengedUser?.username || challengedName,
                        )
                      }
                      alt={challengedName}
                    />
                    <AvatarFallback className="text-[8px] font-bold bg-green-100 text-green-700">
                      {challengedName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* If it's an open challenge with participants in queue, show a generic avatar or count */}
                {challenge.status === "open" && (challenge.participantCount ?? 0) > (challenge.challenger ? 1 : 0) + (challenge.challenged ? 1 : 0) && (
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 ring-1 ring-white dark:ring-slate-800 flex items-center justify-center -ml-1">
                    <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400">
                      +{(challenge.participantCount ?? 0) - ((challenge.challenger ? 1 : 0) + (challenge.challenged ? 1 : 0))}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold ml-1">
                {challenge.participantCount ?? (challenge.challengedUser ? 2 : 1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md" title={challenge.category}>
              <CategoryIcon category={challenge.category} />
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="uppercase">{getCompactTimeAgo(challenge.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
