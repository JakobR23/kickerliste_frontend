import { useRuntimeConfig, navigateTo } from '#imports'
import { useAuthStore } from '~/composables/useAuthStore'
import type {
  User, Team, Fixture, ScoreAdjustment,
  LoginRequest, RegisterRequest, ChangePasswordRequest,
  CreateUserRequest, UpdateUserRequest,
  CreateTeamRequest, UpdateTeamRequest, AddTeamMemberRequest,
  CreateFixtureRequest, UpdateFixtureRequest,
  CreateAdjustmentRequest
} from '~/types/api'

export function useApi() {
  const auth = useAuthStore()
  const config = useRuntimeConfig()

  const client = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,
    onRequest({ options }) {
      if (auth.token.value) {
        const headers = new Headers(options.headers as HeadersInit)
        headers.set('Authorization', `Bearer ${auth.token.value}`)
        options.headers = headers
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        auth.clear()
        await navigateTo('/login')
      }
    }
  })

  return {
    // Auth
    login: (body: LoginRequest) =>
      client<{ token: string }>('/auth/login', { method: 'POST', body }),
    register: (body: RegisterRequest) =>
      client<{ message: string }>('/auth/register', { method: 'POST', body }),
    changePassword: (body: ChangePasswordRequest) =>
      client<{ token: string }>('/auth/change-password', { method: 'POST', body }),

    // Users
    getUsers: (active?: boolean) =>
      client<User[]>('/users', { query: active === false ? { active: 'false' } : {} }),
    getUser: (id: number) => client<User>(`/users/${id}`),
    createUser: (body: CreateUserRequest) =>
      client<User>('/users', { method: 'POST', body }),
    updateUser: (id: number, body: UpdateUserRequest) =>
      client<User>(`/users/${id}`, { method: 'PUT', body }),
    updateUserRole: (id: number, role: 'admin' | 'user') =>
      client<User>(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
    deleteUser: (id: number) =>
      client(`/users/${id}`, { method: 'DELETE' }),
    activateUser: (id: number) =>
      client(`/users/${id}/activate`, { method: 'PATCH' }),

    // Teams
    getTeams: () => client<Team[]>('/teams'),
    getTeam: (id: number) => client<Team>(`/teams/${id}`),
    createTeam: (body: CreateTeamRequest) =>
      client<Team>('/teams', { method: 'POST', body }),
    updateTeam: (id: number, body: UpdateTeamRequest) =>
      client<Team>(`/teams/${id}`, { method: 'PUT', body }),
    deleteTeam: (id: number) =>
      client(`/teams/${id}`, { method: 'DELETE' }),
    getTeamMembers: (id: number) =>
      client<User[]>(`/teams/${id}/members`),
    addTeamMember: (id: number, body: AddTeamMemberRequest) =>
      client<User>(`/teams/${id}/members`, { method: 'POST', body }),
    removeTeamMember: (teamId: number, userId: number) =>
      client(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

    // Fixtures
    getFixtures: (teamId?: number, status?: Fixture['status']) =>
      client<Fixture[]>('/fixtures', {
        query: {
          ...(teamId && { teamId }),
          ...(status && { status })
        }
      }),
    getFixture: (id: number) =>
      client<Fixture>(`/fixtures/${id}`),
    createFixture: (body: CreateFixtureRequest) =>
      client<Fixture>('/fixtures', { method: 'POST', body }),
    updateFixture: (id: number, body: UpdateFixtureRequest) =>
      client<Fixture>(`/fixtures/${id}`, { method: 'PUT', body }),
    deleteFixture: (id: number) =>
      client(`/fixtures/${id}`, { method: 'DELETE' }),
    approveFixture: (id: number) =>
      client<Fixture>(`/fixtures/${id}/approve`, { method: 'PATCH' }),
    rejectFixture: (id: number) =>
      client<Fixture>(`/fixtures/${id}/reject`, { method: 'PATCH' }),

    // Score adjustments (admin only)
    getAdjustments: (userId: number) =>
      client<ScoreAdjustment[]>(`/users/${userId}/adjustments`),
    createAdjustment: (userId: number, body: CreateAdjustmentRequest) =>
      client<ScoreAdjustment>(`/users/${userId}/adjustments`, { method: 'POST', body })
  }
}
