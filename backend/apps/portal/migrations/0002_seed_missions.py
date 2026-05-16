from django.db import migrations


SEED_MISSIONS = [
    {
        "code": "daily_predict_1",
        "title": "First Light",
        "description": "Run your first galaxy classification today.",
        "persona": "all",
        "action_type": "predict",
        "target_count": 1,
        "reward_xp": 20,
        "active": True,
    },
    {
        "code": "daily_predict_3",
        "title": "Triangulation",
        "description": "Classify 3 galaxies today.",
        "persona": "enthusiast",
        "action_type": "predict",
        "target_count": 3,
        "reward_xp": 40,
        "active": True,
    },
    {
        "code": "daily_journal_1",
        "title": "Captain's Log",
        "description": "Write one journal entry today.",
        "persona": "student",
        "action_type": "journal_create",
        "target_count": 1,
        "reward_xp": 30,
        "active": True,
    },
    {
        "code": "daily_collection_2",
        "title": "Archive Curator",
        "description": "Add 2 items to any collection.",
        "persona": "all",
        "action_type": "collection_add",
        "target_count": 2,
        "reward_xp": 35,
        "active": True,
    },
    {
        "code": "daily_module_5",
        "title": "Orbital Tour",
        "description": "Visit 5 modules in the portal today.",
        "persona": "all",
        "action_type": "module_visit",
        "target_count": 5,
        "reward_xp": 50,
        "active": True,
    },
    {
        "code": "daily_research_predict_5",
        "title": "Survey Sprint",
        "description": "Run 5 classifications today.",
        "persona": "researcher",
        "action_type": "predict",
        "target_count": 5,
        "reward_xp": 70,
        "active": True,
    },
    {
        "code": "daily_page_visit_4",
        "title": "Navigator",
        "description": "Open 4 deep-space pages today.",
        "persona": "all",
        "action_type": "page_visit",
        "target_count": 4,
        "reward_xp": 30,
        "active": True,
    },
]


def seed_missions(apps, _schema_editor):
    Mission = apps.get_model("portal", "Mission")
    for row in SEED_MISSIONS:
        Mission.objects.update_or_create(code=row["code"], defaults=row)


class Migration(migrations.Migration):

    dependencies = [
        ("portal", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_missions, migrations.RunPython.noop),
    ]
