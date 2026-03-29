import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useConfirm } from '@/hooks/useConfirm'
import { DataTable } from '@/components/DataTable'
import { DbConnectionModal, type DbConnection } from '@/features/dbconn/DbConnectionModal'

import type { DbConn } from '../../types'
import { dbConnApi } from '../../services/api'
import { SpinnerCustom } from '@/components/ui/spinner'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import Title from '@/components/ui/title'

const col = createColumnHelper<DbConn>()
const selectArray = (d: unknown) => (Array.isArray(d) ? d : [])

const columns = [
  col.accessor('dbKey', { header: 'DB Key', size: 160 }),
  col.accessor('name', { header: 'Название', size: 200 }),
  col.accessor('conString', {
    header: 'Connection String',
    size: 150,
    maxSize: 200,
  }),
]
const coreRowModel = getCoreRowModel()
const sortedRowModel = getSortedRowModel()

const DbConnPage = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbConn | null>(null)

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbconn', search],
    queryFn: () => dbConnApi.getAll(search || undefined),
    select: selectArray,
    staleTime: 30_000,
  })

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['dbconn'] }), [qc])

  const handleSearch = () => {
    if (searchInput === search) return
    setSearch(searchInput)
  }

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: DbConn) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleDelete = async (dbKey: string) => {
    const ok = await confirm({
      title: 'Удалить подключение?',
      description: `DB Key: ${dbKey}`,
    })
    if (!ok) return

    try {
      await dbConnApi.delete(dbKey)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleSave = async (connection: DbConnection) => {
    try {
      if (editing) {
        await dbConnApi.update(connection)
        toast.success('Обновлено')
      } else {
        await dbConnApi.create(connection)
        toast.success('Создано')
      }
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
      throw err
    }
  }

  const table = useReactTable({
    data: (data as DbConn[]) ?? [],
    columns,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    autoResetPageIndex: false,
  })

  return (
    <>
      {ConfirmDialog}

      <Title title="Базы данных" />

      <div className="pageConn">
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Поиск по ключу, названию, строке подключения…"
            className="max-w-90 min-w-30"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />

          <Button size="icon" variant="outline" onClick={handleSearch} disabled={isFetching}>
            {isFetching ? <SpinnerCustom /> : <Search />}
          </Button>

          <Button onClick={handleAdd} size="icon">
            <Plus />
          </Button>
        </div>

        <DataTable
          table={table}
          isLoading={isLoading}
          minWidth={560}
          rowActions={[
            {
              label: 'Пользователи',
              onClick: (db) =>
                navigate({ to: '/dbconn/$dbKey/users', params: { dbKey: db.dbKey } }),
            },
            {
              label: 'Настройки документов',
              onClick: (db) =>
                navigate({ to: '/dbconn/$dbKey/settings', params: { dbKey: db.dbKey } }),
            },
            {
              label: 'SQL запросы',
              onClick: (db) => navigate({ to: '/dbconn/$dbKey/sql', params: { dbKey: db.dbKey } }),
            },
            { label: 'Изменить', onClick: handleEdit },
            {
              label: 'Удалить',
              onClick: (db) => handleDelete(db.dbKey),
              className: 'text-red-600',
            },
          ]}
        />

        <DbConnectionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          editing={editing}
          onSave={handleSave}
        />
      </div>
    </>
  )
}

export default DbConnPage
