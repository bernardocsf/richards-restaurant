import { connectDatabase } from '../config/database';
import { ReservationModel } from '../models/reservation.model';
import { ReviewModel } from '../models/review.model';

async function seed() {
  await connectDatabase();

  await ReservationModel.deleteMany({});
  await ReviewModel.deleteMany({});

  const todayLunch = new Date();
  todayLunch.setHours(12, 0, 0, 0);
  const todayLunchEnd = new Date(todayLunch.getTime() + 180 * 60000);
  const tomorrowDinner = new Date(Date.now() + 86400000);
  tomorrowDinner.setHours(19, 0, 0, 0);
  const tomorrowDinnerEnd = new Date(tomorrowDinner.getTime() + 180 * 60000);

  await ReservationModel.insertMany([
    {
      fullName: 'Marta Silveira',
      phone: '910000001',
      email: 'marta@example.com',
      date: todayLunch,
      startAt: todayLunch,
      endAt: todayLunchEnd,
      time: '12:00',
      guests: 2,
      notes: 'Mesa tranquila, se possível.',
      tablePreference: 'Junto à janela',
      source: 'website',
      assignedTableId: 'M2-01',
      assignedTableType: 'two_top',
      status: 'confirmed'
    },
    {
      fullName: 'Pedro Costa',
      phone: '910000002',
      email: 'pedro@example.com',
      date: tomorrowDinner,
      startAt: tomorrowDinner,
      endAt: tomorrowDinnerEnd,
      time: '19:00',
      guests: 4,
      notes: 'Aniversário.',
      tablePreference: 'Sala principal',
      source: 'phone',
      assignedTableId: 'M4-01',
      assignedTableType: 'four_top',
      status: 'confirmed'
    }
  ]);

  await ReviewModel.insertMany([
    {
      customerName: 'Joana M.',
      rating: 5,
      comment: 'Ambiente muito agradável, staff simpático e excelente apresentação dos pratos.'
    },
    {
      customerName: 'Ricardo L.',
      rating: 4,
      comment: 'Boa variedade de menu. A secção sushi e os grelhados funcionam muito bem em conjunto.'
    },
    {
      customerName: 'Sofia T.',
      rating: 5,
      comment: 'Espaço bonito, acolhedor e com boa experiência global. Voltarei.'
    }
  ]);

  console.log('🌱 Seed concluído com sucesso');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed error', error);
  process.exit(1);
});
