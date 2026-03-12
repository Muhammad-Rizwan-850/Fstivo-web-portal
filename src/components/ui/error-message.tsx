'use client';

import React from 'react';
import { AlertCircle, XCircle, Info, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  className?: string;
  onDismiss?: () => void;
}

export const ErrorMessage = React.memo(function ErrorMessage({
  title,
  message,
  type = 'error',
  className,
  onDismiss
}: ErrorMessageProps) {
  const icons = {
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    success: CheckCircle
  };

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        colors[type],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
})

// Helper function to convert technical errors to user-friendly messages
export function getUserFriendlyError(error: any): string {
  const errorMessages: Record<string, string> = {
    'PGRST116': 'The item you\'re looking for doesn\'t exist.',
    'PGRST301': 'You don\'t have permission to access this.',
    '23505': 'This item already exists.',
    '23503': 'Cannot delete because it\'s being used elsewhere.',
    'ECONNREFUSED': 'Unable to connect. Please check your internet connection.',
    'ETIMEDOUT': 'The request took too long. Please try again.',
    'NetworkError': 'Network error. Please check your connection.',
    'ValidationError': 'Please check your input and try again.',
    'AuthError': 'Please sign in to continue.',
    'PaymentError': 'Payment failed. Please check your payment details.',
    'QuotaExceeded': 'You\'ve reached your plan limit. Please upgrade.',
  };

  // Check for specific error codes
  if (error?.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  // Check for error type
  if (error?.name && errorMessages[error.name]) {
    return errorMessages[error.name];
  }

  // Check error message for keywords
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('network')) return errorMessages.NetworkError;
  if (message.includes('timeout')) return errorMessages.ETIMEDOUT;
  if (message.includes('unauthorized') || message.includes('forbidden')) {
    return errorMessages.PGRST301;
  }
  if (message.includes('not found')) return errorMessages.PGRST116;

  // Default friendly message
  return 'Something went wrong. Please try again or contact support if the problem persists.';
}
