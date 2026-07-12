import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import BrandDashboardOverview from "@/features/campaigns/components/BrandDashboardOverview"

export default function DiscoverCreatorsPage() {
  return (
    <ProtectedRoute allowedRoles={["brand"]}>
      <BrandDashboardOverview />
    </ProtectedRoute>
  )
}
