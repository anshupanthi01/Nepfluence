import enum


class AdminStaffRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    FINANCE_OPS = "finance_ops"
    SUPPORT = "support"
    CONTENT_MODERATOR = "content_moderator"
    ANALYST = "analyst"
