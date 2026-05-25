import AuthPanel, { normalizeRole } from "@/components/Auth/AuthPanel"

type LoginPageProps = {
  searchParams?: Promise<{
    role?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return <AuthPanel mode="login" role={normalizeRole(params?.role)} />
}
