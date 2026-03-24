import * as React from 'react'
import { cn } from '@/lib/utils'

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm [&_tr:first-child]:border-0', className)}
      {...props}
    />
  ),
)
Table.displayName = 'Table'

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('sticky top-0 z-10', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />)
TableBody.displayName = 'TableBody'

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn('border-0 bg-muted/50 font-medium ', className)} {...props} />
))
TableFooter.displayName = 'TableFooter'

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-t   border-gray-300 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className,
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground bg-muted/50 whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-2 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

interface ScrollableTableWrapperProps {
  maxHeight?: string | number
  minWidth?: string | number
  className?: string
  children: React.ReactNode
}

export const ScrollableTableWrapper = React.forwardRef<HTMLDivElement, ScrollableTableWrapperProps>(
  ({ maxHeight = '400px', minWidth = '640px', className, children }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-border overflow-hidden bg-background', className)}
    >
      <div className="overflow-auto" style={{ maxHeight }}>
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  ),
)
ScrollableTableWrapper.displayName = 'ScrollableTableWrapper'
