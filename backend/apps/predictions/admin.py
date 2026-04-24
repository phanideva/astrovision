from django.contrib import admin

from .models import Prediction


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "predicted_class", "confidence", "created_at")
    list_filter = ("predicted_class",)
    search_fields = ("user__email",)
    readonly_fields = ("created_at",)
