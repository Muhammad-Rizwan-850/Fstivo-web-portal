'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>
      {action && (
        <div className="flex gap-3">
          <button
            onClick={action.onClick}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition-colors',
              action.variant === 'outline'
                ? 'border border-gray-300 hover:bg-gray-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {action.label}
          </button>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
})

// Specialized Empty States
export const NoEventsEmpty = React.memo(function NoEventsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      title="No events yet"
      description="Create your first event and start connecting with your audience. It only takes a few minutes to get started."
      action={{
        label: "Create Event",
        onClick: onCreate
      }}
      secondaryAction={{
        label: "View Examples",
        onClick: () => window.open('/examples', '_blank')
      }}
    />
  );
})

export const NoTicketsEmpty = React.memo(function NoTicketsEmpty({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      }
      title="No tickets found"
      description="You haven't purchased any tickets yet. Browse events and get your tickets to amazing experiences."
      action={{
        label: "Browse Events",
        onClick: onBrowse
      }}
    />
  );
})

export const SearchEmpty = React.memo(function SearchEmpty(props: { query: string; onReset: () => void }) {
  const { query, onReset } = props;
  return (
    <EmptyState
      icon={
        <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={`We couldn't find any events matching "${query}". Try adjusting your search or browse all events.`}
      action={{
        label: "Clear Search",
        onClick: onReset,
        variant: "outline"
      }}
      secondaryAction={{
        label: "Browse All",
        onClick: () => window.location.href = '/events'
      }}
    />
  );
})

export const ErrorEmpty = React.memo(function ErrorEmpty({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-24 h-24 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Something went wrong"
      description={message || "We're having trouble loading this content. Please try again."}
      action={{
        label: "Try Again",
        onClick: onRetry
      }}
    />
  );
})
