from django.core.management.base import BaseCommand
from cafe.models import Table, Room


class Command(BaseCommand):
    help = 'Regenerate all QR codes with network IP URLs'

    def handle(self, *args, **options):
        self.stdout.write('🔄 Regenerating QR codes with network IP URLs...')
        
        # Regenerate table QR codes
        tables = Table.objects.all()
        table_count = 0
        for table in tables:
            if table.qr_code:
                table.qr_code.delete(save=False)  # Delete old QR code
            table.generate_qr_code()
            table_count += 1
            self.stdout.write(f'✅ Regenerated QR for Table {table.table_number}')
        
        # Regenerate room QR codes
        rooms = Room.objects.all()
        room_count = 0
        for room in rooms:
            if room.qr_code:
                room.qr_code.delete(save=False)  # Delete old QR code
            room.generate_qr_code()
            room_count += 1
            self.stdout.write(f'✅ Regenerated QR for Room {room.room_number}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'🎉 Successfully regenerated {table_count} table QR codes and {room_count} room QR codes!'
            )
        )
        from django.conf import settings
        self.stdout.write(f'📱 QR codes now point to: {settings.FRONTEND_URL}')
