import type { Metadata } from 'next';
import { ReviewsPageContent } from '@/components/reviews-page-content';

export const metadata: Metadata = {
  title: 'Reviews',
  description:
    'Consulta reviews publicadas e submete feedback no website do Richard\'s Restaurant Grill.'
};

export default function ReviewsPage() {
  return <ReviewsPageContent />;
}
