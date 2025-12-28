import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminQuery, adminApiRequest } from "@/lib/adminApi";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Lock,
  CheckCircle,
  AlertCircle,
  Coins,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EscrowStats {
  totalEscrow: number;
  pendingChallenges: number;
  holdingAmount: number;
}

interface EscrowChallenge {
  id: number;
  title: string;
  category: string;
  amount: number;
  status: string;
  totalEscrow: number;
  escrowCount: number;
  createdAt: string;
  challenger?: { username: string };
  challenged?: { username: string };
}

interface EscrowData {
  stats: EscrowStats;
  challenges: EscrowChallenge[];
}

export default function AdminEscrow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "date" | "id">("amount");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: escrowData, isLoading, error } = useAdminQuery<EscrowData>(
    "/api/admin/escrow",
    { retry: false }
  );

  const stats = escrowData?.stats || {
    totalEscrow: 0,
    pendingChallenges: 0,
    holdingAmount: 0,
  };

  let challenges = escrowData?.challenges || [];

  // Filter by search query
  if (searchQuery) {
    challenges = challenges.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toString().includes(searchQuery) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort challenges
  challenges = [...challenges].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return b.totalEscrow - a.totalEscrow;
      case "date":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "id":
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Escrow Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage funds held in escrow for challenges
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                Total Escrow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalEscrow)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Across all challenges
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="w-4 h-4 text-green-600" />
                Holding Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.holdingAmount)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Actively held
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Pending Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.pendingChallenges}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                With escrow entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Escrow Challenges List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Escrow Challenges</CardTitle>
              <Badge variant="outline">{challenges.length} total</Badge>
            </div>
            <div className="mt-4 flex gap-4">
              <Input
                placeholder="Search by title, ID, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="amount">Sort by Amount</option>
                  <option value="date">Sort by Date</option>
                  <option value="id">Sort by ID</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading escrow data...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Failed to load escrow data
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No escrow challenges found
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === challenge.id ? null : challenge.id
                        )
                      }
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600">
                            #{challenge.id}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {challenge.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {challenge.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {challenge.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Created{" "}
                          {formatDistanceToNow(new Date(challenge.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600">
                            {formatCurrency(challenge.totalEscrow)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {challenge.escrowCount} entries
                          </p>
                        </div>
                        {expandedId === challenge.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === challenge.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Challenge Amount
                            </p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatCurrency(challenge.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Total Escrow Held
                            </p>
                            <p className="text-lg font-semibold text-amber-600 mt-1">
                              {formatCurrency(challenge.totalEscrow)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Challenger
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {challenge.challenger?.username || "System"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">
                              Challenged
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {challenge.challenged?.username || "TBD"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View Challenge Details →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
