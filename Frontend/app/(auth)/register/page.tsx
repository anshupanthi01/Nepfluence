import AuthPanel, { normalizeRole } from "@/components/Auth/AuthPanel"

type RegisterPageProps = {
  searchParams?: Promise<{
    role?: string
  }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams

  return <AuthPanel mode="register" role={normalizeRole(params?.role)} />
}
