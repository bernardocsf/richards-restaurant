import { connectDatabase } from '../config/database';
import { ReservationModel } from '../models/reservation.model';
import { ReviewModel } from '../models/review.model';

async function seed() {
  await connectDatabase();

  await ReservationModel.deleteMany({});
  await ReviewModel.deleteMany({});

  const todayLunch = new Date();
  todayLunch.setHours(12, 15, 0, 0);
  const todayLunchEnd = new Date(todayLunch.getTime() + 135 * 60000);

  const tomorrowDinner = new Date(Date.now() + 86400000);
  tomorrowDinner.setHours(19, 30, 0, 0);
  const tomorrowDinnerEnd = new Date(tomorrowDinner.getTime() + 135 * 60000);

  await ReservationModel.insertMany([
    {
      referenceCode: 'RGR-DEMO01',
      fullName: 'Marta Silveira',
      phone: '910000001',
      email: 'marta@example.com',
      date: new Date(todayLunch.getFullYear(), todayLunch.getMonth(), todayLunch.getDate()),
      startAt: todayLunch,
      endAt: todayLunchEnd,
      time: '12:15',
      guests: 2,
      zone: 'interior',
      notes: 'Mesa tranquila, se possível.',
      source: 'website',
      status: 'confirmed_auto',
      consentAccepted: true,
      emailNotificationStatus: 'skipped',
      whatsappNotificationStatus: 'skipped'
    },
    {
      referenceCode: 'RGR-DEMO02',
      fullName: 'Pedro Costa',
      phone: '910000002',
      email: 'pedro@example.com',
      date: new Date(tomorrowDinner.getFullYear(), tomorrowDinner.getMonth(), tomorrowDinner.getDate()),
      startAt: tomorrowDinner,
      endAt: tomorrowDinnerEnd,
      time: '19:30',
      guests: 6,
      zone: 'terrace',
      notes: 'Aniversário.',
      source: 'phone',
      status: 'confirmed_auto',
      consentAccepted: false,
      emailNotificationStatus: 'skipped',
      whatsappNotificationStatus: 'skipped'
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

  console.log('Seed concluído com sucesso');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed error', error);
  process.exit(1);
});
