from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from datetime import datetime, timezone
import os
from typing import Optional

from database import get_db
from models import User

# JWT Configuration - matching Next.js auth system
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

class JWTAuth:
    @staticmethod
    def verify_jwt_token(token: str) -> Optional[dict]:
        """Verify JWT token from Next.js auth system"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Check token expiration
            if payload.get("exp") and datetime.now(timezone.utc).timestamp() > payload["exp"]:
                return None
                
            return payload
        except jwt.InvalidTokenError:
            return None

    @staticmethod
    def get_current_user_from_token(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ) -> User:
        """Get current user from JWT token"""
        token = credentials.credentials
        payload = JWTAuth.verify_jwt_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user

    @staticmethod
    def get_current_user_optional(
        request: Request,
        db: Session = Depends(get_db)
    ) -> Optional[User]:
        """Get current user from token (optional, doesn't raise exceptions)"""
        try:
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None
                
            token = auth_header.replace("Bearer ", "")
            payload = JWTAuth.verify_jwt_token(token)
            
            if not payload:
                return None
                
            user_id = payload.get("sub")
            if not user_id:
                return None
                
            user = db.query(User).filter(
                User.id == user_id,
                User.is_active == True
            ).first()
            
            return user
        except Exception:
            return None

# Convenience functions for dependency injection
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user (required)"""
    return JWTAuth.get_current_user_from_token(credentials, db)

def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated (optional)"""
    return JWTAuth.get_current_user_optional(request, db)

def require_verified_user(current_user: User = Depends(get_current_user)) -> User:
    """Require user to be verified"""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user