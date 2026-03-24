import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNavigate } from '@tanstack/react-router'

interface LoginFormValues {
  password: string
}

const LoginPage = () => {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>()

  const onSubmit = ({ password }: LoginFormValues) => {
    if (password === '009999') {
      sessionStorage.setItem('isLoggedIn', 'true')
      toast.success('Login successful!')
      navigate({ to: '/' })
    } else {
      toast.error('Incorrect password.')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-80 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Login</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              {...register('password', { required: 'Please input your password!' })}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Log In
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
