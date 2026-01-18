import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react"
import { formatDate } from "../../../utils"

export interface TradeRow {
  date: string
  type: "buy" | "sell" | string
  price: number
  quantity: number
  profit_loss: number
}

export interface TradesTableProps {
  trades: TradeRow[]
}

export default function TradesTable({ trades }: TradesTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(trades.length / itemsPerPage);

  const currentTrades = trades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  return (
    <Card className="glass-card border-border bg-card h-full">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold">
            <Receipt
              className="w-4 h-4 text-emerald-500"
              strokeWidth={2}
            />
            Trade History
          </CardTitle>
          {trades.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full border border-border/50">
              {trades.length} trades
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">
                  Type
                </TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">
                  Price
                </TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">
                  Quantity
                </TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase text-right">
                  P&amp;L
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm h-32">
                    No trades found.
                  </TableCell>
                </TableRow>
              ) : (
                currentTrades.map((trade, index) => (
                  <TableRow
                    key={index}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(trade.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          trade.type === "buy"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }
                      >
                        {trade.type === "buy" ? (
                          <ArrowUpCircle
                            className="w-3 h-3 mr-1"
                            strokeWidth={2}
                          />
                        ) : (
                          <ArrowDownCircle
                            className="w-3 h-3 mr-1"
                            strokeWidth={2}
                          />
                        )}
                        {trade.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      ${trade.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {trade.quantity}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold text-sm ${trade.profit_loss >= 0
                        ? "text-green-400"
                        : "text-red-400"
                        }`}
                    >
                      {trade.profit_loss >= 0 ? "+" : "-"}$
                      {Math.abs(trade.profit_loss).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {trades.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-white/[0.01]">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium text-foreground bg-muted/20 border border-border rounded-md hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Previous
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-foreground bg-muted/20 border border-border rounded-md hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
