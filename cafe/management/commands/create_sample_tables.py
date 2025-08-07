from django.core.management.base import BaseCommand
from cafe.models import Table


class Command(BaseCommand):
    help = 'Create sample tables for the restaurant'

    def handle(self, *args, **options):
        # Create sample tables if they don't exist
        tables_data = [
            {'table_number': 'T1', 'table_name': 'Window Table', 'capacity': 4},
            {'table_number': 'T2', 'table_name': 'Corner Table', 'capacity': 6},
            {'table_number': 'T3', 'table_name': 'Center Table', 'capacity': 4},
            {'table_number': 'T4', 'table_name': 'Outdoor Table', 'capacity': 4},
            {'table_number': 'T5', 'table_name': 'VIP Table', 'capacity': 8},
            {'table_number': 'T6', 'table_name': 'Family Table', 'capacity': 6},
            {'table_number': 'T7', 'table_name': 'Bar Table', 'capacity': 2},
            {'table_number': 'T8', 'table_name': 'Garden Table', 'capacity': 4},
        ]

        created_count = 0
        for table_data in tables_data:
            table, created = Table.objects.get_or_create(
                table_number=table_data['table_number'],
                defaults={
                    'table_name': table_data['table_name'],
                    'capacity': table_data['capacity'],
                    'is_active': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created table: {table.table_number} - {table.table_name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new tables')
        )
