import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table'
import { Home, ChevronRight, Plus, Search } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useConfirm } from '@/hooks/useConfirm'
import { DataTable } from '@/components/DataTable'
import { SpinnerCustom } from '@/components/ui/spinner'
import type { DbUser } from '@/types'
import { dbUserRoute } from '@/router'
import { dbUserApi } from '@/services/api'
import { DbUserFormDialog } from './DbUserFormDialog'

const col = createColumnHelper<DbUser>()
const columns = [
  col.accessor('id', { header: 'ID', size: 60 }),
  col.accessor('userName', { header: 'Пользователь', size: 180 }),
  col.accessor('dbname', { header: 'DB Name', size: 160 }),
  col.accessor('docUserId', { header: 'DocUserID', size: 60 }),
  col.accessor('url', { header: 'URL', size: 260 }),
]

const DbUserPage = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { dbKey: dbKeyParam } = dbUserRoute.useParams()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbUser | null>(null)

  const {
    data: items = [],
    isFetching,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbuser', dbKeyParam, search],
    queryFn: () => dbUserApi.getByDbKey(dbKeyParam, search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
    enabled: !!dbKeyParam,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dbuser', dbKeyParam] })

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: DbUser) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить привязку пользователя к БД?' })
    if (!ok) return
    try {
      await dbUserApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  })

  return (
    <div className="pageConn">
      {ConfirmDialog}

      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => navigate({ to: '/dbconn' })}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <Home className="h-4 w-4" />
        </button>
        <ChevronRight className="h-3 w-3" />
        <button
          onClick={() => navigate({ to: '/dbconn' })}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Подключения к БД
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{dbKeyParam ?? 'DB Users'}</span>
      </nav>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {dbKeyParam && (
          <>
            <Input
              placeholder="Поиск по пользователю, db, url…"
              className="w-70"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            />
            <Button variant="outline" size="icon" onClick={() => setSearch(searchInput)}>
              {isFetching ? <SpinnerCustom /> : <Search />}
            </Button>
            <Button onClick={handleAdd} size="icon">
              <Plus />
            </Button>
          </>
        )}
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        rowActions={[
          { label: 'Изменить', onClick: handleEdit },
          {
            label: 'Удалить',
            onClick: (db) => handleDelete(db.id),
            className: 'text-red-600',
          },
        ]}
      />

      <DbUserFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        dbKeyParam={dbKeyParam}
        onSaved={invalidate}
      />
    </div>
  )
}

export default DbUserPage
