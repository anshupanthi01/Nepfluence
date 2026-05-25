import AuthPanel, { normalizeRole } from "@/components/Auth/AuthPanel"

type SignupPageProps = {
  searchParams?: Promise<{
    role?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams

  return <AuthPanel mode="register" role={normalizeRole(params?.role)} />
}
