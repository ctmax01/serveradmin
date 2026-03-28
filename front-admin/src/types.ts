export interface User {
  id: number
  name: string
  phone: string
  password?: string
  startDate: string
  lastDbKey?: string | null
}

export interface DbConn {
  dbKey: string
  conString: string
  name?: string
}

export interface DbSql {
  id: number
  dbKey: string
  sqlKey: string
  sqlValue?: string
  connName?: string
}

export interface DbUser {
  id: number
  userId: number
  dbKey: string
  dbname?: string
  url?: string
  userName?: string
  connName?: string
  xreport: boolean
  zakazVirtual: boolean
  stoplist: boolean
  passwords: boolean
  notifications: boolean
  docs: boolean
  stockReport: boolean
  relazReport: boolean
  cashSummary: boolean
  cashbook: boolean
  msettlements: boolean
  users: boolean
  category: boolean
  printers: boolean
  reservation: boolean
  dynamicReports: boolean
  reportIds?: number[]
  docUserId?: number
}

export interface Report {
  id: number
  name: string
  description: string
  sqlQuery: string
  queryType: 'SP' | 'SQL'
  includeUnknownColumns: boolean
  sortOrder: number
  isActive: boolean
}

export interface ReportColumn {
  id: number
  reportId: number
  colKey: string
  colLabel: string
  colStyle: string | null
  sortOrder: number
}

export interface DocSetting {
  id: number
  dbKey: string
  settingKey: string
  docType?: number
  value: string
}
