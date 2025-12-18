"""
Role-based permission utilities and workflow logic.
"""
from typing import Optional
from fastapi import HTTPException, status


def get_next_stage(current_stage: str, action: str) -> Optional[str]:
    """
    Determine the next workflow stage based on current stage and action.

    Args:
        current_stage: Current workflow stage
        action: Action taken (approve/reject)

    Returns:
        Next stage or None if workflow is complete
    """
    workflow_sequence = [
        "digital_marketer",
        "designer",
        "frontend_developer",
        "manager",
        "admin",
        "client",
        "completed"
    ]

    if action == "reject":
        # Rejection always returns to designer stage
        return "designer"

    # Find current stage index
    try:
        current_index = workflow_sequence.index(current_stage)
    except ValueError:
        return None

    # Move to next stage
    if current_index < len(workflow_sequence) - 1:
        return workflow_sequence[current_index + 1]

    return None


def can_approve_stage(user_role: str, project_stage: str) -> bool:
    """
    Check if a user role can approve the current project stage.

    Args:
        user_role: User's role
        project_stage: Current project stage

    Returns:
        True if user can approve, False otherwise
    """
    # Mapping of stages to roles that can approve them
    stage_role_mapping = {
        "frontend_developer": ["Frontend Developer"],
        "manager": ["Manager"],
        "admin": ["Admin"],
        "client": ["Client"]
    }

    allowed_roles = stage_role_mapping.get(project_stage, [])
    return user_role in allowed_roles


def can_upload_design(user_role: str) -> bool:
    """
    Check if user can upload designs.

    Args:
        user_role: User's role

    Returns:
        True if user can upload, False otherwise
    """
    return user_role == "Designer"


def can_create_project(user_role: str) -> bool:
    """
    Check if user can create projects.

    Args:
        user_role: User's role

    Returns:
        True if user can create projects, False otherwise
    """
    return user_role in ["Admin", "Manager", "Digital Marketer"]


def validate_stage_transition(
    current_stage: str,
    user_role: str,
    action: str
) -> None:
    """
    Validate if a stage transition is allowed.

    Args:
        current_stage: Current project stage
        user_role: User's role
        action: Action to perform

    Raises:
        HTTPException: If transition is not allowed
    """
    if action == "approve":
        if not can_approve_stage(user_role, current_stage):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You cannot approve at stage: {current_stage}"
            )
    elif action == "reject":
        # Only approvers can reject
        if not can_approve_stage(user_role, current_stage):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You cannot reject at stage: {current_stage}"
            )
