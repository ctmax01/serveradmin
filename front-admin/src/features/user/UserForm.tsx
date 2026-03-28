import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface UserFormValues {
  name: string
  phone: string
  password?: string
  lastDbKey?: string
}

interface UserFormProps {
  register: UseFormRegister<UserFormValues>
  errors: FieldErrors<UserFormValues>
  isEditing: boolean
}

const UserForm = ({ register, errors, isEditing }: UserFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input {...register('name', { required: 'Имя обязательно' })} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input {...register('phone', { required: 'Телефон обязателен' })} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          {...register('password', {
            required: !isEditing ? 'Пароль обязателен' : false,
            minLength: { value: 8, message: 'Пароль должен содержать не менее 8 символов' },
          })}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
    </div>
  )
}

export default UserForm
