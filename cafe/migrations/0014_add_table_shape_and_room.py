# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cafe', '0013_auto_20250807_1826'),
    ]

    operations = [
        migrations.AddField(
            model_name='table',
            name='shape',
            field=models.CharField(choices=[('rectangle', 'Rectangle'), ('circle', 'Circle')], default='rectangle', max_length=20),
        ),
        migrations.AddField(
            model_name='table',
            name='width',
            field=models.IntegerField(default=120),
        ),
        migrations.AddField(
            model_name='table',
            name='height',
            field=models.IntegerField(default=80),
        ),
        migrations.AddField(
            model_name='table',
            name='radius',
            field=models.IntegerField(default=60),
        ),
    ]
