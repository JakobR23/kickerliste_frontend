export type Role = 'admin' | 'user'
export type MatchResult = 'team_1' | 'team_2' | 'draw'
export type FixtureStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: number
  username: string
  role: Role
  active: boolean
  totalScore: number
}

export interface Team {
  id: number
  name: string | null
  created_at: string
  members: User[]
}

export interface Fixture {
  id: number
  team1Id: number
  team2Id: number
  result: MatchResult
  team1Score: number | null
  team2Score: number | null
  playedAt: string
  value: number
  status: FixtureStatus
  submittedBy: number | null
}

export interface ScoreAdjustment {
  id: number
  userId: number
  amount: number
  reason: string
  createdBy: number
  createdAt: string
}

export interface TokenResponse {
  token: string
}

export interface JwtClaims {
  userId: number
  username: string
  role: Role
  forcePasswordChange: boolean
  exp: number
  iat: number
}

export interface ApiError {
  message: string
}

// Request bodies
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface CreateUserRequest {
  username: string
  password: string
}

export interface UpdateUserRequest {
  username: string
}

export interface CreateTeamRequest {
  name?: string | null
}

export interface UpdateTeamRequest {
  name?: string | null
}

export interface AddTeamMemberRequest {
  userId: number
}

export interface CreateFixtureRequest {
  team1Id: number
  team2Id: number
  result: MatchResult
  team1Score?: number | null
  team2Score?: number | null
  playedAt?: string
  value?: number
}

export interface UpdateFixtureRequest {
  result: MatchResult
  team1Score?: number | null
  team2Score?: number | null
  value?: number
}

export interface CreateAdjustmentRequest {
  amount: number
  reason: string
}
