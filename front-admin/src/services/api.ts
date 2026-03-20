import axios from 'axios'
import type { User, DbConn, DbSql, DbUser, Report, Setting } from '../types'

const apiClient = axios.create({
  baseURL: 'http://192.168.0.10:81/z-admin/core/admin',
})

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body?.success === false) {
      const raw = body.errors ?? body.message ?? 'Unknown error'
      const msg = typeof raw === 'string' ? raw : JSON.stringify(raw)
      return Promise.reject(new Error(msg))
    }
    return body?.data ?? body
  },
  (error) => {
    const body = error.response?.data
    const msg = body?.errors || body?.message || error.message
    console.error('API Error:', msg)
    return Promise.reject(new Error(msg))
  },
)

// --- Users ---
const userApi = {
  getList: (search?: string): Promise<User[]> =>
    apiClient.get('/users/', { params: search ? { search } : undefined }),
  getOne: (id: number): Promise<User> => apiClient.get('/users/', { params: { id } }),
  create: (data: { name: string; phone: string; password: string }): Promise<{ id: number }> =>
    apiClient.post('/users/', data),
  update: (data: Partial<User> & { id: number }): Promise<void> => apiClient.put('/users/', data),
  delete: (id: number): Promise<void> => apiClient.delete('/users/', { data: { id } }),
}

// --- DB Connections ---
const dbConnApi = {
  getAll: (search?: string): Promise<DbConn[]> =>
    apiClient.get('/dbconn/', { params: search ? { search } : undefined }),
  create: (data: { dbKey: string; conString: string; name?: string }): Promise<void> =>
    apiClient.post('/dbconn/', data),
  update: (data: { dbKey: string; conString: string; name?: string }): Promise<void> =>
    apiClient.put('/dbconn/', data),
  delete: (dbKey: string): Promise<void> => apiClient.delete('/dbconn/', { data: { dbKey } }),
}

// --- DB SQL ---
const dbSqlApi = {
  getAll: (search?: string): Promise<DbSql[]> =>
    apiClient.get('/dbsql/', { params: search ? { search } : undefined }),
  create: (data: { dbKey: string; sqlKey: string; sqlValue?: string }): Promise<void> =>
    apiClient.post('/dbsql/', data),
  update: (data: { id: number; dbKey: string; sqlKey: string; sqlValue?: string }): Promise<void> =>
    apiClient.put('/dbsql/', data),
  delete: (id: number): Promise<void> => apiClient.delete('/dbsql/', { data: { id } }),
}

// --- DB Users ---
const dbUserApi = {
  getAll: (): Promise<DbUser[]> => apiClient.get('/dbuser/'),
  getByDbKey: (dbKey: string, search?: string): Promise<DbUser[]> =>
    apiClient.get('/dbuser/', { params: search ? { dbKey, search } : { dbKey } }),
  create: (data: Omit<DbUser, 'id' | 'userName' | 'connName'>): Promise<void> =>
    apiClient.post('/dbuser/', data),
  update: (data: Omit<DbUser, 'userName' | 'connName'>): Promise<void> =>
    apiClient.put('/dbuser/', data),
  delete: (id: number): Promise<void> => apiClient.delete('/dbuser/', { data: { id } }),
}

// --- Reports ---
const reportApi = {
  getAll: (search?: string): Promise<Report[]> =>
    apiClient.get('/reports/', { params: search ? { search } : undefined }),
  create: (data: Omit<Report, 'id'>): Promise<void> => apiClient.post('/reports/', data),
  update: (data: Report): Promise<void> => apiClient.put('/reports/', data),
  delete: (id: number): Promise<void> => apiClient.delete('/reports/', { data: { id } }),
}

// --- Settings ---
const settingApi = {
  getAll: (search?: string): Promise<Setting[]> =>
    apiClient.get('/settings/', { params: search ? { search } : undefined }),
  create: (data: Omit<Setting, 'id'>): Promise<void> => apiClient.post('/settings/', data),
  update: (data: Setting): Promise<void> => apiClient.put('/settings/', data),
  delete: (id: number): Promise<void> => apiClient.delete('/settings/', { data: { id } }),
}

export { userApi, dbConnApi, dbSqlApi, dbUserApi, reportApi, settingApi }
