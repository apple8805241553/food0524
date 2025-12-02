'use client'

import { useAuth } from '@/hooks/auth-context'

export default function QuickLoginPage() {
  const { login, auth } = useAuth()
  console.log(auth)
  return (
    <div>
      <br />
      <br />
      <br />
      <br />
      <br />
      <button
        className="btn btn-primary"
        onClick={() => {
          login('william.miller@example.com', 'william1234')
        }}
      >
        登入 william@test.com
      </button>
      <hr />
      <button
        className="btn btn-warning"
        onClick={() => {
          login('veronica.jones@example.com', 'veronica1234')
        }}
      >
        登入 veronica@test.com
      </button>
      <hr />
      <button
        className="btn btn-secondary"
        onClick={() => {
          login('mary@test.com', '123456')
        }}
      >
        登入 mary@test.com
      </button>
      <hr />
      <hr />
      <div className="alert alert-success">登入的用戶: {auth.email}</div>
      <div className="alert alert-success">登入的用戶ID: {auth.user_id}</div>
    </div>
  )
}
