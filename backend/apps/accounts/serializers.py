from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    display_name = serializers.CharField(required=False, allow_blank=True)
    persona = serializers.ChoiceField(
        choices=User.Persona.choices,
        required=False,
    )

    class Meta:
        model = User
        fields = ("id", "email", "password", "display_name", "persona")
        read_only_fields = ("id",)

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            display_name=validated_data.get("display_name", ""),
            persona=validated_data.get("persona", User.Persona.ENTHUSIAST),
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "date_joined",
            "persona",
            "display_name",
            "avatar_seed",
            "bio",
            "onboarded_at",
            "timezone",
        )
        read_only_fields = fields


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("persona", "display_name", "avatar_seed", "bio", "onboarded_at", "timezone")
