import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthScreen } from '../frontend/src/components/AuthScreen.jsx'

afterEach(cleanup)

function makeAuth(overrides = {}) {
  return {
    signUp: { email: vi.fn().mockResolvedValue({ data: { token: null }, error: null }) },
    signIn: { email: vi.fn().mockResolvedValue({ data: null, error: null }) },
    emailOtp: {
      verifyEmail: vi.fn().mockResolvedValue({ data: { token: 'session-token' }, error: null }),
      sendVerificationOtp: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    ...overrides,
  }
}

async function createAccount(auth) {
  render(<AuthScreen auth={auth} configured />)
  fireEvent.click(screen.getByRole('button', { name: 'Create an account' }))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Tess Rubin' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'tess@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
  fireEvent.click(screen.getByRole('button', { name: /Create account/ }))
  await screen.findByRole('heading', { name: 'Verify your email' })
}

describe('AuthScreen email verification', () => {
  it('shows a code field when signup requires verification', async () => {
    const auth = makeAuth()
    await createAccount(auth)

    expect(screen.getByLabelText('Verification code')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('tess@example.com')
  })

  it('submits the six-digit code to Neon Auth', async () => {
    const auth = makeAuth()
    await createAccount(auth)

    fireEvent.change(screen.getByLabelText('Verification code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Verify email/ }))

    await waitFor(() => expect(auth.emailOtp.verifyEmail).toHaveBeenCalledWith({
      email: 'tess@example.com',
      otp: '123456',
    }))
    expect(await screen.findByText('Email verified. Sign in to continue.')).toBeInTheDocument()
  })
})
