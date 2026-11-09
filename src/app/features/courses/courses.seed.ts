import { Category, Course } from '../../core/models';
import { generateThumbnail } from './thumbnail';

// Instructor ids match users.seed.ts: 5 = Dina Instructor, 6 = Karim Instructor.
const course = (
  id: number,
  title: string,
  category: Category,
  price: number,
  instructorId: number,
  rating: number,
  description: string,
): Course => ({ id, title, category, price, instructorId, rating, description, thumbnail: generateThumbnail(category, title) });

export const COURSES_SEED: Course[] = [
  course(1, 'UI Design Fundamentals', 'Design', 49.99, 5, 4.7, 'Learn layout, colour, typography and spacing, then design your first app screens in Figma.'),
  course(2, 'Brand Identity Workshop', 'Design', 59.99, 5, 4.5, 'Build a complete brand: logo, colour palette, type system and a one-page style guide.'),
  course(3, 'Motion Graphics Basics', 'Design', 39.99, 6, 4.3, 'Animate shapes and text for social media, from keyframes to exporting short clips.'),
  course(4, 'Startup Business Planning', 'Business', 54.99, 6, 4.6, 'Validate an idea, size the market and write a lean business plan investors can read in ten minutes.'),
  course(5, 'Digital Marketing Essentials', 'Business', 44.99, 5, 4.4, 'Plan campaigns across search, social and email, and measure what actually works.'),
  course(6, 'Financial Literacy for Freelancers', 'Business', 29.99, 6, 4.2, 'Price your work, track income and expenses, and understand taxes and invoices.'),
  course(7, 'Web Development with Angular', 'Programming', 69.99, 5, 4.8, 'Build a responsive single-page app with components, routing, forms and unit tests.'),
  course(8, 'Python for Data Analysis', 'Programming', 64.99, 6, 4.6, 'Clean, explore and visualise real datasets with pandas and matplotlib.'),
  course(9, 'Git and Team Workflows', 'Programming', 24.99, 6, 4.5, 'Branches, pull requests and merge conflicts: the Git habits that keep a team moving.'),
];
