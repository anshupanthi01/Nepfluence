import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import BrandDashboardOverview from "@/features/campaigns/components/BrandDashboardOverview"

export default function MessagesPage() {
  return (
    <ProtectedRoute allowedRoles={["brand"]}>
      <BrandDashboardOverview />
    </ProtectedRoute>
  )
}
