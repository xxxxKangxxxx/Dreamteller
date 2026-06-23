import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps.auth import get_current_user_id
from app.services.supabase_client import get_supabase
from app.utils.envelope import success

logger = logging.getLogger(__name__)

router = APIRouter()
UserId = Annotated[str, Depends(get_current_user_id)]


@router.delete("")
def delete_account(user_id: UserId) -> dict[str, Any]:
    """계정 영구 삭제.

    auth.users 행을 삭제하면 profiles → dreams/interpretations/characters/...
    까지 ON DELETE CASCADE로 함께 삭제된다(001_initial.sql 참고).
    """
    sb = get_supabase()
    try:
        # service_role 키로만 호출 가능한 Admin API
        sb.auth.admin.delete_user(user_id)
    except Exception as exc:  # noqa: BLE001 - 외부 SDK 예외를 일괄 처리
        logger.exception("account deletion failed: user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DELETE_ACCOUNT_FAILED",
        ) from exc

    return success({"deleted": True})
