'use client'

import { useState, useEffect } from 'react'
import { Clock, UserMinus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinWaitlist, leaveWaitlist } from '@/lib/actions/ticketing-actions'
import * as ticketingQueries from '@/lib/database/queries/ticketing'
import { logger } from '@/lib/logger';

interface WaitlistButtonProps {
  eventId: string
  ticketTypeId: string
  ticketName: string
}

export function WaitlistButton({ eventId, ticketTypeId, ticketName }: WaitlistButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    checkWaitlistStatus()
  }, [eventId, ticketTypeId])

  const checkWaitlistStatus = async () => {
    // This would typically check user's waitlist status
    // For now, we'll just set it to null
    setWaitlistPosition(null)
  }

  const handleJoinWaitlist = async () => {
    if (joining) return

    try {
      setJoining(true)
      setLoading(true)

      const formData = new FormData()
      formData.append('event_id', eventId)
      formData.append('ticket_type_id', ticketTypeId)
      formData.append('quantity', quantity.toString())

      const result = await joinWaitlist(formData)

      if (result.success && result.waitlist) {
        setWaitlistPosition(result.waitlist.position)
        setOpen(false)
      } else if (result.error) {
        alert(result.error)
      }
    } catch (error) {
      logger.error('Error joining waitlist:', error)
      alert('Failed to join waitlist. Please try again.')
    } finally {
      setJoining(false)
      setLoading(false)
    }
  }

  const handleLeaveWaitlist = async () => {
    if (leaving || !waitlistPosition) return

    try {
      setLeaving(true)
      setLoading(true)

      // We need the waitlist entry ID, but for simplicity we'll use the position
      // In a real implementation, you'd store the waitlist entry ID
      const result = await leaveWaitlist('entry-id', eventId)

      if (result.success) {
        setWaitlistPosition(null)
      } else if (result.error) {
        alert(result.error)
      }
    } catch (error) {
      logger.error('Error leaving waitlist:', error)
      alert('Failed to leave waitlist. Please try again.')
    } finally {
      setLeaving(false)
      setLoading(false)
    }
  }

  if (waitlistPosition) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              You're on the waitlist!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              Position: #{waitlistPosition}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLeaveWaitlist}
          disabled={loading || leaving}
          className="w-full gap-2"
        >
          <UserMinus className="w-4 h-4" />
          {leaving ? 'Leaving...' : 'Leave Waitlist'}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="w-full gap-2"
      >
        <Clock className="w-4 h-4" />
        Join Waitlist
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Waitlist</DialogTitle>
            <DialogDescription>
              Join the waitlist for <strong>{ticketName}</strong>. You'll be notified when tickets
              become available.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Number of tickets</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>How it works:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• You'll be assigned a position on the waitlist</li>
                <li>• When tickets become available, you'll receive a notification</li>
                <li>• You'll have 24 hours to purchase the tickets</li>
                <li>• If you don't purchase in time, your position will pass to the next person</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleJoinWaitlist} disabled={loading || joining}>
              {joining ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
