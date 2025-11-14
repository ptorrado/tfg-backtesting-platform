import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Badge } from "../ui/badge"
import { ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react"

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
  return (
    <Card className="glass-card border-white/5">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-gray-100 flex items-center gap-2 text-base font-semibold">
          <Receipt
            className="w-4 h-4 text-emerald-500"
            strokeWidth={2}
          />
          Trade History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium text-xs uppercase">
                  Date
                </TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase">
                  Type
                </TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase">
                  Price
                </TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase">
                  Quantity
                </TableHead>
                <TableHead className="text-gray-400 font-medium text-xs uppercase text-right">
                  P&amp;L
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 10).map((trade, index) => (
                <TableRow
                  key={index}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-gray-300 text-sm">
                    {trade.date}
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
                  <TableCell className="text-gray-300 font-mono text-sm">
                    ${trade.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {trade.quantity}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold text-sm ${
                      trade.profit_loss >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {trade.profit_loss >= 0 ? "+" : "-"}$
                    {Math.abs(trade.profit_loss).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {trades.length > 10 && (
          <div className="p-4 text-center border-t border-white/5">
            <p className="text-xs text-gray-500">
              Showing 10 of {trades.length} trades
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
