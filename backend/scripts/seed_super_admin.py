"""One-time CLI to create the first Super Admin account.

There is no public registration path to becoming an admin (by design - see
CLAUDE.md / the admin panel plan). Run this once to bootstrap the first
Super Admin; every other staff account is then created from inside the
panel itself (POST /api/admin/staff).

Usage (from backend/):
    uv run python scripts/seed_super_admin.py --username ops_admin --email admin@nepfluence.com --password <pw>
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.admin import crud as staff_crud  # noqa: E402
from src.admin.enums import AdminStaffRole  # noqa: E402
from src.auth import hash_password  # noqa: E402
from src.database import AsyncSessionLocal  # noqa: E402
from src.users import crud as users_crud  # noqa: E402

# Every model class is linked to others via forward-string relationships (e.g.
# users.model.User.brand_profile -> "BrandProfile" -> BrandProfile.posts -> "Campaign"
# -> Campaign.proposals -> "CampaignProposal", and so on). The first ORM query that
# selects a mapped class directly forces SQLAlchemy to resolve every relationship
# reachable from it, so every model module in the app must already be imported by
# then. main.py gets this for free because it imports every domain's router (which
# imports that domain's models); this standalone script doesn't touch most routers,
# so it must import every models module itself.
from src.admin import models as _admin_models  # noqa: E402,F401
from src.brand_profile import models as _brand_profile_models  # noqa: E402,F401
from src.influencer_profile import models as _influencer_profile_models  # noqa: E402,F401
from src.campaign import models as _campaign_models  # noqa: E402,F401
from src.campaign_proposal import models as _campaign_proposal_models  # noqa: E402,F401
from src.collaboration import models as _collaboration_models  # noqa: E402,F401
from src.conversations import models as _conversations_models  # noqa: E402,F401
from src.platform_settings import models as _platform_settings_models  # noqa: E402,F401


async def main(username: str, email: str, password: str, force: bool) -> None:
    async with AsyncSessionLocal() as db:
        existing_count = await staff_crud.count_active_super_admins(db)
        if existing_count > 0 and not force:
            print(
                f"Refusing to continue: {existing_count} active Super Admin(s) already exist. "
                "Pass --force to create another anyway."
            )
            return

        if await users_crud.get_by_username(db, username):
            print(f"Username '{username}' already exists.")
            return
        if await users_crud.get_by_email(db, email):
            print(f"Email '{email}' already exists.")
            return

        profile = await staff_crud.create_staff(
            db,
            username=username,
            email=email,
            password_hash=hash_password(password),
            staff_role=AdminStaffRole.SUPER_ADMIN,
            created_by_admin_id=None,
        )
        print(f"Created Super Admin '{profile.user.username}' (user_id={profile.user_id}).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Create a Super Admin even if one already exists.",
    )
    args = parser.parse_args()

    asyncio.run(main(args.username, args.email, args.password, args.force))
