'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setError(null)
    setIsLoading(true)
    const { error: signOutError } = await createClient().auth.signOut()

    if (signOutError) {
      setError('Unable to sign out right now. Please try again.')
      setIsLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button type="button" variant="outline" disabled={isLoading} onClick={handleSignOut} className="h-11 rounded-xl border-white/20 bg-transparent px-5 text-white hover:bg-white/10">
        {isLoading ? 'Signing out…' : 'Sign out'}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
