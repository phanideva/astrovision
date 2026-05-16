from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Persona(models.TextChoices):
        ENTHUSIAST = "enthusiast", "Enthusiast"
        STUDENT = "student", "Student / Educator"
        RESEARCHER = "researcher", "Researcher"

    username = None
    email = models.EmailField(unique=True)
    persona = models.CharField(
        max_length=24,
        choices=Persona.choices,
        default=Persona.ENTHUSIAST,
    )
    display_name = models.CharField(max_length=120, blank=True)
    avatar_seed = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    onboarded_at = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.email
