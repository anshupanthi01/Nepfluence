from src.admin.enums import AdminStaffRole

MODULE_USERS = "users"
MODULE_STAFF = "staff"
MODULE_CAMPAIGNS = "campaigns"
MODULE_ESCROW = "escrow"

# Stage 2 module keys, reserved now so nav/permission wiring is additive later.
MODULE_ANALYTICS = "analytics"
MODULE_DISPUTES = "disputes"
MODULE_MODERATION = "moderation"
MODULE_SETTINGS = "settings"
MODULE_AUDIT_LOG = "audit_log"

MODULE_PERMISSIONS: dict[str, set[AdminStaffRole]] = {
    MODULE_USERS: {AdminStaffRole.SUPER_ADMIN, AdminStaffRole.SUPPORT},
    MODULE_STAFF: {AdminStaffRole.SUPER_ADMIN},
    MODULE_CAMPAIGNS: {
        AdminStaffRole.SUPER_ADMIN,
        AdminStaffRole.SUPPORT,
        AdminStaffRole.CONTENT_MODERATOR,
    },
    MODULE_ESCROW: {AdminStaffRole.SUPER_ADMIN, AdminStaffRole.FINANCE_OPS},
    MODULE_ANALYTICS: {
        AdminStaffRole.SUPER_ADMIN,
        AdminStaffRole.FINANCE_OPS,
        AdminStaffRole.SUPPORT,
        AdminStaffRole.CONTENT_MODERATOR,
        AdminStaffRole.ANALYST,
    },
    MODULE_DISPUTES: {AdminStaffRole.SUPER_ADMIN, AdminStaffRole.SUPPORT, AdminStaffRole.FINANCE_OPS},
    MODULE_MODERATION: {AdminStaffRole.SUPER_ADMIN, AdminStaffRole.CONTENT_MODERATOR},
    MODULE_SETTINGS: {AdminStaffRole.SUPER_ADMIN},
    MODULE_AUDIT_LOG: {AdminStaffRole.SUPER_ADMIN, AdminStaffRole.ANALYST},
}


def allowed_modules_for(staff_role: AdminStaffRole) -> list[str]:
    return [module for module, roles in MODULE_PERMISSIONS.items() if staff_role in roles]
